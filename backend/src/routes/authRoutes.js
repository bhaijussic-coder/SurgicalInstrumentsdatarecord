const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const { authLoginSchema, authRegisterSchema } = require("../utils/validationSchemas");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/bootstrap-status", asyncHandler(authController.bootstrapStatus));
router.post("/register", validate(authRegisterSchema), asyncHandler(authController.register));
router.post("/login", validate(authLoginSchema), asyncHandler(authController.login));
router.get("/me", requireAuth, asyncHandler(authController.me));

module.exports = router;
