const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  testRecordSchema,
  testListQuerySchema,
  historyParamSchema,
  testIdParamSchema,
} = require("../utils/validationSchemas");
const testsController = require("../controllers/testsController");

const router = express.Router();

router.use(requireAuth);

router.get("/dashboard-summary", asyncHandler(testsController.dashboardSummary));
router.get("/testers", asyncHandler(testsController.listTesters));
router.get("/", validate(testListQuerySchema), asyncHandler(testsController.listTests));
router.get("/history/:serialNumber", validate(historyParamSchema), asyncHandler(testsController.instrumentHistory));
router.get("/:id", validate(testIdParamSchema), asyncHandler(testsController.getTestById));

router.post(
  "/",
  requireRole("admin", "tester"),
  validate(testRecordSchema),
  asyncHandler(testsController.createTest)
);

router.put(
  "/:id",
  requireRole("admin", "tester"),
  validate(testIdParamSchema),
  validate(testRecordSchema),
  asyncHandler(testsController.updateTest)
);

module.exports = router;
