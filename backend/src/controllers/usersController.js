const bcrypt = require("bcryptjs");
const ApiError = require("../utils/apiError");
const backupService = require("../services/backupService");
const usersRepository = require("../repositories/usersRepository");

async function listUsers(req, res) {
  const users = await usersRepository.listUsers();
  res.json(
    users.map((user) => ({
      id: String(user.id),
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      is_active: Boolean(user.is_active),
      created_at: user.created_at,
    }))
  );
}

async function createUser(req, res) {
  const { fullName, email, password, role } = req.body;
  const existing = await usersRepository.findByEmail(email.toLowerCase());
  if (existing) {
    throw new ApiError(409, "A user with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await usersRepository.createUser({
    full_name: fullName,
    email: email.toLowerCase(),
    password_hash: passwordHash,
    role,
  });

  res.status(201).json({
    id: String(user.id),
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    is_active: Boolean(user.is_active),
    created_at: user.created_at,
  });
}

async function updateUserStatus(req, res) {
  const { id } = req.params;
  const { isActive } = req.body;

  const existingUser = await usersRepository.findById(id);
  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  if (!isActive && req.user.id === id) {
    throw new ApiError(400, "You cannot deactivate your own account");
  }

  if (!isActive && existingUser.role === "admin" && existingUser.is_active) {
    const activeAdminCount = await usersRepository.countActiveAdmins();
    if (activeAdminCount <= 1) {
      throw new ApiError(400, "At least one active admin account is required");
    }
  }

  const user = await usersRepository.updateUserStatus(id, isActive);

  res.json({
    id: String(user.id),
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    is_active: Boolean(user.is_active),
    created_at: user.created_at,
  });
}

async function exportBackup(req, res) {
  const backup = await backupService.exportBackup();
  res.json(backup);
}

async function restoreBackup(req, res) {
  const result = await backupService.restoreBackup(req.body);
  res.json(result);
}

module.exports = {
  listUsers,
  createUser,
  updateUserStatus,
  exportBackup,
  restoreBackup,
};
