const { execute } = require("../db/mysql");

async function fetchTestById(testId, connection = null) {
  const rows = await execute(
    `SELECT
       tr.id,
       tr.instrument_id,
       i.name AS instrument_name,
       i.serial_number,
       i.instrument_type,
       c.name AS category,
       tr.continuity_detection,
       tr.resistance_value,
       tr.force_value,
       tr.current_value,
       tr.result,
       tr.test_count,
       tr.repeated_failure_alert,
       tr.remarks,
       tr.tested_at,
       tr.created_at,
       u.id AS tested_by_id,
       u.full_name AS tested_by_name
     FROM test_records tr
     JOIN instruments i ON tr.instrument_id = i.id
     JOIN categories c ON tr.category_id = c.id
     JOIN users u ON tr.tested_by = u.id
     WHERE tr.id = ?
     LIMIT 1`,
    [testId],
    connection
  );
  return rows[0] || null;
}

async function findLastTestByInstrument(instrumentId, connection = null) {
  const rows = await execute(
    `SELECT test_count FROM test_records WHERE instrument_id = ? ORDER BY test_count DESC LIMIT 1`,
    [instrumentId],
    connection
  );
  return rows[0] || null;
}

async function findPreviousResultsForInstrument(instrumentId, excludeTestId = null, connection = null) {
  const params = [instrumentId];
  let query = `SELECT result FROM test_records WHERE instrument_id = ?`;
  if (excludeTestId !== null) {
    query += " AND id <> ?";
    params.push(excludeTestId);
  }
  query += " ORDER BY tested_at DESC LIMIT 2";
  return execute(query, params, connection);
}

async function insertTestRecord(record, connection = null) {
  const result = await execute(
    `INSERT INTO test_records (
       instrument_id,
       category_id,
       continuity_detection,
       resistance_value,
       force_value,
       current_value,
       result,
       test_count,
       repeated_failure_alert,
       remarks,
       tested_by,
       tested_at,
       created_at,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      record.instrument_id,
      record.category_id,
      record.continuity_detection ? 1 : 0,
      record.resistance_value,
      record.force_value,
      record.current_value,
      record.result,
      record.test_count,
      record.repeated_failure_alert ? 1 : 0,
      record.remarks,
      record.tested_by,
      record.tested_at,
    ],
    connection
  );
  return fetchTestById(result.insertId, connection);
}

async function updateTestRecord(testId, record, connection = null) {
  await execute(
    `UPDATE test_records SET
       instrument_id = ?,
       category_id = ?,
       continuity_detection = ?,
       resistance_value = ?,
       force_value = ?,
       current_value = ?,
       result = ?,
       repeated_failure_alert = ?,
       remarks = ?,
       tested_at = ?,
       updated_at = NOW()
     WHERE id = ?`,
    [
      record.instrument_id,
      record.category_id,
      record.continuity_detection ? 1 : 0,
      record.resistance_value,
      record.force_value,
      record.current_value,
      record.result,
      record.repeated_failure_alert ? 1 : 0,
      record.remarks,
      record.tested_at,
      testId,
    ],
    connection
  );
  return fetchTestById(testId, connection);
}

async function listTestRecords(filters) {
  const where = ["1 = 1"];
  const params = [];

  if (filters.search) {
    const pattern = `%${filters.search.trim().replace(/[%_]/g, "\\$&")}%`;
    where.push("(i.serial_number LIKE ? OR i.name LIKE ?)");
    params.push(pattern, pattern);
  }

  if (filters.dateFrom) {
    where.push("tr.tested_at >= ?");
    params.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    where.push("tr.tested_at <= ?");
    params.push(filters.dateTo);
  }

  if (filters.instrumentType) {
    where.push("i.instrument_type = ?");
    params.push(filters.instrumentType);
  }

  if (filters.category) {
    where.push("c.name = ?");
    params.push(filters.category);
  }

  if (filters.result) {
    where.push("tr.result = ?");
    params.push(filters.result);
  }

  if (filters.testedBy) {
    where.push("tr.tested_by = ?");
    params.push(filters.testedBy);
  }

  const sortByMap = {
    tested_at: "tr.tested_at",
    serial_number: "i.serial_number",
    instrument_name: "i.name",
    result: "tr.result",
    test_count: "tr.test_count",
  };

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const sortBy = sortByMap[filters.sortBy] || "tr.tested_at";
  const sortOrder = filters.sortOrder === "asc" ? "ASC" : "DESC";
  const offset = (page - 1) * pageSize;

  const countQuery = `SELECT COUNT(*) AS total FROM test_records tr
    JOIN instruments i ON tr.instrument_id = i.id
    JOIN categories c ON tr.category_id = c.id
    JOIN users u ON tr.tested_by = u.id
    WHERE ${where.join(" AND ")}`;
  const countRow = await execute(countQuery, params);
  const total = countRow[0]?.total || 0;

  const dataQuery = `SELECT
      tr.id,
      i.name AS instrument_name,
      i.serial_number,
      i.instrument_type,
      c.name AS category,
      tr.continuity_detection,
      tr.resistance_value,
      tr.force_value,
      tr.current_value,
      tr.result,
      tr.test_count,
      tr.repeated_failure_alert,
      tr.remarks,
      tr.tested_at,
      u.id AS tested_by_id,
      u.full_name AS tested_by_name
    FROM test_records tr
    JOIN instruments i ON tr.instrument_id = i.id
    JOIN categories c ON tr.category_id = c.id
    JOIN users u ON tr.tested_by = u.id
    WHERE ${where.join(" AND ")}
    ORDER BY ${sortBy} ${sortOrder}, tr.id ${sortOrder}
    LIMIT ${Number(offset)}, ${Number(pageSize)}`;

  const dataRows = await execute(dataQuery, params);

  return {
    data: dataRows.map((row) => ({
      ...row,
      id: String(row.id),
      tested_by_id: String(row.tested_by_id),
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: total ? Math.ceil(total / pageSize) : 0,
    },
  };
}

async function getDashboardSummary() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const [summaryRow] = await execute(
    `SELECT
      COUNT(*) AS total_tested_today,
      SUM(tr.result = 'Pass') AS total_passed_today,
      SUM(tr.result = 'Fail') AS total_failed_today
      FROM test_records tr
      WHERE tr.tested_at >= ? AND tr.tested_at < ?`,
    [todayStart, tomorrowStart]
  );

  const recentRows = await execute(
    `SELECT
      tr.id,
      i.name AS instrument_name,
      i.serial_number,
      tr.result,
      tr.test_count,
      tr.tested_at,
      tr.repeated_failure_alert
      FROM test_records tr
      JOIN instruments i ON tr.instrument_id = i.id
      ORDER BY tr.tested_at DESC
      LIMIT 10`
  );

  return {
    total_tested_today: summaryRow?.total_tested_today || 0,
    total_passed_today: summaryRow?.total_passed_today || 0,
    total_failed_today: summaryRow?.total_failed_today || 0,
    recent: recentRows.map((row) => ({
      id: String(row.id),
      instrument_name: row.instrument_name,
      serial_number: row.serial_number,
      result: row.result,
      test_count: row.test_count,
      tested_at: row.tested_at,
      repeated_failure_alert: Boolean(row.repeated_failure_alert),
    })),
  };
}

async function getInstrumentHistory(serialNumber) {
  const instrumentRows = await execute(
    "SELECT id, name, serial_number, instrument_type FROM instruments WHERE serial_number = ? LIMIT 1",
    [serialNumber]
  );
  const instrument = instrumentRows[0];
  if (!instrument) {
    return null;
  }

  const records = await execute(
    `SELECT
      tr.id,
      tr.tested_at,
      tr.result,
      tr.continuity_detection,
      tr.resistance_value,
      tr.force_value,
      tr.current_value,
      tr.test_count,
      tr.repeated_failure_alert,
      tr.remarks,
      c.name AS category,
      u.full_name AS tested_by_name
    FROM test_records tr
    JOIN categories c ON tr.category_id = c.id
    JOIN users u ON tr.tested_by = u.id
    WHERE tr.instrument_id = ?
    ORDER BY tr.tested_at DESC`,
    [instrument.id]
  );

  return {
    instrument: {
      id: String(instrument.id),
      name: instrument.name,
      serial_number: instrument.serial_number,
      instrument_type: instrument.instrument_type,
    },
    totals: records.reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.result === "Pass") acc.passed += 1;
        if (row.result === "Fail") acc.failed += 1;
        return acc;
      },
      { total: 0, passed: 0, failed: 0 }
    ),
    trend: {
      passRate: records.length ? Number(((records.filter((row) => row.result === "Pass").length / records.length) * 100).toFixed(2)) : 0,
      failRate: records.length ? Number(((records.filter((row) => row.result === "Fail").length / records.length) * 100).toFixed(2)) : 0,
    },
    history: records.map((row) => ({
      id: String(row.id),
      tested_at: row.tested_at,
      result: row.result,
      continuity_detection: Boolean(row.continuity_detection),
      resistance_value: row.resistance_value,
      force_value: row.force_value,
      current_value: row.current_value,
      test_count: row.test_count,
      repeated_failure_alert: Boolean(row.repeated_failure_alert),
      remarks: row.remarks,
      category: row.category,
      tested_by_name: row.tested_by_name,
    })),
  };
}

module.exports = {
  fetchTestById,
  findLastTestByInstrument,
  findPreviousResultsForInstrument,
  insertTestRecord,
  updateTestRecord,
  listTestRecords,
  getDashboardSummary,
  getInstrumentHistory,
};
