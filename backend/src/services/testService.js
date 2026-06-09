const ApiError = require("../utils/apiError");
const categoriesRepository = require("../repositories/categoriesRepository");
const instrumentsRepository = require("../repositories/instrumentsRepository");
const testRecordsRepository = require("../repositories/testRecordsRepository");
const { transaction } = require("../db/mysql");

function resolveResult(payload) {
  if (payload.result) {
    return payload.result;
  }
  return payload.continuityDetection === "Detected" ? "Pass" : "Fail";
}

function ensureNumericId(value, fieldName) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
  return id;
}

async function createTestRecord(payload, userId) {
  return transaction(async (connection) => {
    const categoryId = await categoriesRepository.getCategoryIdByName(payload.category, connection);
    if (!categoryId) {
      throw new ApiError(400, `Unknown category: ${payload.category}`);
    }

    const instrument = await instrumentsRepository.upsertInstrument(payload, connection);
    const computedResult = resolveResult(payload);
    const testedAt = payload.testedAt ? new Date(payload.testedAt) : new Date();

    const lastRecord = await testRecordsRepository.findLastTestByInstrument(instrument.id, connection);
    const previousResults = await testRecordsRepository.findPreviousResultsForInstrument(instrument.id, null, connection);

    const testCount = (lastRecord?.test_count || 0) + 1;
    const repeatedFailureAlert =
      computedResult === "Fail" &&
      previousResults.length === 2 &&
      previousResults.every((row) => row.result === "Fail");

    const record = await testRecordsRepository.insertTestRecord(
      {
        instrument_id: instrument.id,
        category_id: categoryId,
        continuity_detection: payload.continuityDetection === "Detected",
        resistance_value: payload.resistanceValue,
        force_value: payload.forceValue,
        current_value: payload.currentValue,
        result: computedResult,
        test_count: testCount,
        repeated_failure_alert: repeatedFailureAlert,
        remarks: payload.remarks || null,
        tested_by: ensureNumericId(userId, "user id"),
        tested_at: testedAt,
      },
      connection
    );

    return record;
  });
}

async function updateTestRecord(testId, payload) {
  return transaction(async (connection) => {
    const recordId = ensureNumericId(testId, "test id");
    const existing = await testRecordsRepository.fetchTestById(recordId, connection);
    if (!existing) {
      throw new ApiError(404, "Test record not found");
    }

    const categoryId = await categoriesRepository.getCategoryIdByName(payload.category, connection);
    if (!categoryId) {
      throw new ApiError(400, `Unknown category: ${payload.category}`);
    }

    const instrument = await instrumentsRepository.upsertInstrument(payload, connection);
    const computedResult = resolveResult(payload);
    const testedAt = payload.testedAt ? new Date(payload.testedAt) : new Date(existing.tested_at);

    const previousResults = await testRecordsRepository.findPreviousResultsForInstrument(instrument.id, recordId, connection);
    const repeatedFailureAlert =
      computedResult === "Fail" &&
      previousResults.length === 2 &&
      previousResults.every((row) => row.result === "Fail");

    return testRecordsRepository.updateTestRecord(
      recordId,
      {
        instrument_id: instrument.id,
        category_id: categoryId,
        continuity_detection: payload.continuityDetection === "Detected",
        resistance_value: payload.resistanceValue,
        force_value: payload.forceValue,
        current_value: payload.currentValue,
        result: computedResult,
        repeated_failure_alert: repeatedFailureAlert,
        remarks: payload.remarks || null,
        tested_at: testedAt,
      },
      connection
    );
  });
}

async function fetchTestById(testId) {
  const record = await testRecordsRepository.fetchTestById(ensureNumericId(testId, "test id"));
  if (!record) {
    throw new ApiError(404, "Test record not found");
  }
  return record;
}

async function listTestRecords(filters) {
  return testRecordsRepository.listTestRecords(filters);
}

async function getDashboardSummary() {
  return testRecordsRepository.getDashboardSummary();
}

async function getInstrumentHistory(serialNumber) {
  const data = await testRecordsRepository.getInstrumentHistory(serialNumber);
  if (!data) {
    throw new ApiError(404, "No instrument found for this serial number");
  }
  return data;
}

module.exports = {
  createTestRecord,
  updateTestRecord,
  fetchTestById,
  listTestRecords,
  getDashboardSummary,
  getInstrumentHistory,
};
