const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { createUserSchema, updateUserStatusSchema } = require("../utils/validationSchemas");
const usersController = require("../controllers/usersController");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", asyncHandler(usersController.listUsers));
router.post("/", validate(createUserSchema), asyncHandler(usersController.createUser));
router.get("/backup/export", asyncHandler(usersController.exportBackup));
router.post("/backup/restore", asyncHandler(usersController.restoreBackup));
router.patch("/:id/status", validate(updateUserStatusSchema), asyncHandler(usersController.updateUserStatus));

module.exports = router;
