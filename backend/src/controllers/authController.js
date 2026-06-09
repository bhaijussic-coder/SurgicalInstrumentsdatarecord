const bcrypt = require("bcryptjs");
const ApiError = require("../utils/apiError");
const { signToken } = require("../utils/jwt");
const usersRepository = require("../repositories/usersRepository");

async function bootstrapStatus(req, res) {
  const usersCount = await usersRepository.countUsers();
  res.json({ requiresBootstrap: usersCount === 0 });
}

async function register(req, res) {
  const { fullName, email, password } = req.body;
  const usersCount = await usersRepository.countUsers();
  const isBootstrap = usersCount === 0;

  if (!isBootstrap) {
    throw new ApiError(403, "Self registration is disabled after bootstrap");
  }

  const existingUser = await usersRepository.findByEmail(email.toLowerCase());
  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userDoc = await usersRepository.createUser({
    full_name: fullName,
    email: email.toLowerCase(),
    password_hash: passwordHash,
    role: "admin",
  });

  const user = {
    id: String(userDoc.id),
    full_name: userDoc.full_name,
    email: userDoc.email,
    role: userDoc.role,
    created_at: userDoc.created_at,
  };
  const token = signToken({ sub: user.id, role: user.role });

  res.status(201).json({ user, token });
}

async function login(req, res) {
  const { email, password } = req.body;
  const usersCount = await usersRepository.countUsers();

  if (usersCount === 0) {
    throw new ApiError(409, "No users found yet. Create the first admin account to continue.");
  }

  const user = await usersRepository.findByEmail(email.toLowerCase());

  if (!user || !user.is_active || !user.password_hash) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const userId = String(user.id);
  const token = signToken({ sub: userId, role: user.role });

  res.json({
    token,
    user: {
      id: userId,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    },
  });
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = {
  bootstrapStatus,
  register,
  login,
  me,
};
