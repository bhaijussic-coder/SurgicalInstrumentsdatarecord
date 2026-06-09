const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { reportQuerySchema } = require("../utils/validationSchemas");
const reportsController = require("../controllers/reportsController");

const router = express.Router();

router.use(requireAuth);

router.get("/", validate(reportQuerySchema), asyncHandler(reportsController.getReport));
router.get(
  "/export",
  requireRole("admin", "tester"),
  validate(reportQuerySchema),
  asyncHandler(reportsController.exportReport)
);

module.exports = router;
