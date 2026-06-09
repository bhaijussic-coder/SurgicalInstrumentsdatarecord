const { z } = require("zod");

const numericIdSchema = z.coerce.number().int().positive();

const authLoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

const authRegisterSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

const testRecordSchema = z.object({
  body: z.object({
    instrumentName: z.string().min(2),
    serialNumber: z.string().min(3),
    instrumentType: z.enum(["Production", "R&D"]),
    category: z.enum(["Fresh", "Rework", "For Trial"]),
    continuityDetection: z.enum(["Detected", "Not Detected"]),
    resistanceValue: z.number().nonnegative(),
    forceValue: z.number().nonnegative(),
    currentValue: z.number().nonnegative(),
    result: z.enum(["Pass", "Fail"]).optional(),
    testedAt: z.string().datetime().optional(),
    remarks: z.string().max(2000).optional(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

const testListQuerySchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(200).optional(),
    search: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    instrumentType: z.enum(["Production", "R&D"]).optional(),
    category: z.enum(["Fresh", "Rework", "For Trial"]).optional(),
    result: z.enum(["Pass", "Fail"]).optional(),
    testedBy: numericIdSchema.optional(),
    sortBy: z.enum(["tested_at", "serial_number", "instrument_name", "result", "test_count"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
  params: z.object({}).passthrough(),
});

const historyParamSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    serialNumber: z.string().min(3),
  }),
});

const testIdParamSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: numericIdSchema,
  }),
});

const reportQuerySchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({
    period: z.enum(["daily", "weekly", "monthly"]).optional(),
    date: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    format: z.enum(["excel", "pdf"]).optional(),
    instrumentType: z.enum(["Production", "R&D"]).optional(),
    category: z.enum(["Fresh", "Rework", "For Trial"]).optional(),
    result: z.enum(["Pass", "Fail"]).optional(),
    testedBy: numericIdSchema.optional(),
  }),
  params: z.object({}).passthrough(),
});

const createUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["admin", "tester", "viewer"]),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

const updateUserStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({
    id: numericIdSchema,
  }),
});

module.exports = {
  authLoginSchema,
  authRegisterSchema,
  testRecordSchema,
  testListQuerySchema,
  historyParamSchema,
  testIdParamSchema,
  reportQuerySchema,
  createUserSchema,
  updateUserStatusSchema,
};
