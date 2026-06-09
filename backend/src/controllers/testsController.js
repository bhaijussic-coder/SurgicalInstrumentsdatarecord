const testService = require("../services/testService");
const usersRepository = require("../repositories/usersRepository");

async function createTest(req, res) {
  const record = await testService.createTestRecord(req.body, req.user.id);
  res.status(201).json(record);
}

async function updateTest(req, res) {
  const record = await testService.updateTestRecord(req.params.id, req.body);
  res.json(record);
}

async function getTestById(req, res) {
  const record = await testService.fetchTestById(req.params.id);
  res.json(record);
}

async function listTests(req, res) {
  const result = await testService.listTestRecords(req.query);
  res.json(result);
}

async function dashboardSummary(req, res) {
  const summary = await testService.getDashboardSummary();
  res.json(summary);
}

async function instrumentHistory(req, res) {
  const data = await testService.getInstrumentHistory(req.params.serialNumber);
  res.json(data);
}

async function listTesters(req, res) {
  const users = await usersRepository.listActiveTesters();
  res.json(users.map((user) => ({ id: String(user.id), full_name: user.full_name })));
}

module.exports = {
  createTest,
  updateTest,
  getTestById,
  listTests,
  dashboardSummary,
  instrumentHistory,
  listTesters,
};
