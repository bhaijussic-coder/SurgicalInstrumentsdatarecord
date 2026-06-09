const ApiError = require("../utils/apiError");
const { verifyToken } = require("../utils/jwt");
const usersRepository = require("../repositories/usersRepository");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication required"));
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verifyToken(token);
    const userId = Number(decoded.sub) || decoded.sub;
    const userDoc = await usersRepository.findById(userId);

    if (!userDoc || !userDoc.is_active) {
      return next(new ApiError(401, "Invalid user session"));
    }

    req.user = {
      id: userDoc.id,
      full_name: userDoc.full_name,
      email: userDoc.email,
      role: userDoc.role,
      is_active: Boolean(userDoc.is_active),
    };
    next();
  } catch (error) {
    next(new ApiError(401, "Invalid or expired token"));
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission for this action"));
    }
    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
