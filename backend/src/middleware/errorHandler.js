const ApiError = require("../utils/apiError");

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

function normalizeError(error) {
  if (error.message === "Not allowed by CORS") {
    return new ApiError(403, error.message);
  }

  if (error.code === 11000) {
    const fields = Object.keys(error.keyPattern || error.keyValue || {});
    return new ApiError(
      409,
      "A record with the same unique value already exists",
      fields.map((field) => ({
        path: field,
        message: `${field} must be unique`,
      }))
    );
  }

  if (error.name === "ValidationError") {
    return new ApiError(
      400,
      "Validation failed",
      Object.values(error.errors || {}).map((issue) => ({
        path: issue.path,
        message: issue.message,
      }))
    );
  }

  return error;
}

function errorHandler(error, req, res, next) {
  const normalizedError = normalizeError(error);
  const statusCode = normalizedError.statusCode || 500;
  const payload = {
    message: normalizedError.message || "Internal server error",
  };

  if (normalizedError.details) {
    payload.details = normalizedError.details;
  }

  if (process.env.NODE_ENV !== "production" && normalizedError.stack) {
    payload.stack = normalizedError.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
