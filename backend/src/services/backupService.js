const { execute, transaction } = require("../db/mysql");
const ApiError = require("../utils/apiError");

function normalizeDate(value, fallback = new Date()) {
  if (!value) {
    return fallback;
  }

  const candidate = new Date(value);
  return Number.isNaN(candidate.getTime()) ? fallback : candidate;
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function exportBackup() {
  const categories = await execute("SELECT id, name, created_at, updated_at FROM categories ORDER BY id ASC");
  const users = await execute("SELECT id, full_name, email, password_hash, role, is_active, created_at, updated_at FROM users ORDER BY created_at ASC");
  const instruments = await execute("SELECT id, name, serial_number, instrument_type, created_at, updated_at FROM instruments ORDER BY created_at ASC");
  const testRecords = await execute("SELECT id, instrument_id, category_id, continuity_detection, resistance_value, force_value, current_value, result, test_count, repeated_failure_alert, remarks, tested_by, tested_at, created_at, updated_at FROM test_records ORDER BY tested_at ASC");

  return {
    exportedAt: new Date().toISOString(),
    version: 2,
    categories,
    users,
    instruments,
    testRecords,
  };
}

async function restoreCategories(categories, connection) {
  const idMap = new Map();
  let restoredCount = 0;

  for (const category of categories) {
    const name = normalizeString(category?.name);
    if (!name) {
      continue;
    }

    const createdAt = normalizeDate(category.created_at);
    const updatedAt = normalizeDate(category.updated_at, createdAt);

    await execute(
      "INSERT IGNORE INTO categories (name, created_at, updated_at) VALUES (?, ?, ?)",
      [name, createdAt, updatedAt],
      connection
    );

    const [row] = await execute(
      "SELECT id FROM categories WHERE name = ? LIMIT 1",
      [name],
      connection
    );

    if (!row) {
      continue;
    }

    const newId = row.id;
    const sourceId = category.id || category._id;
    if (sourceId) {
      idMap.set(String(sourceId), newId);
    }
    idMap.set(name, newId);
    restoredCount += 1;
  }

  return { map: idMap, restoredCount };
}

async function restoreUsers(users, connection) {
  const idMap = new Map();
  let restoredCount = 0;

  for (const user of users) {
    const fullName = normalizeString(user?.full_name);
    const email = normalizeString(user?.email).toLowerCase();
    const passwordHash = normalizeString(user?.password_hash);
    const role = normalizeString(user?.role) || "viewer";
    const isActive = typeof user?.is_active === "boolean" ? user.is_active : true;

    if (!fullName || !email || !passwordHash) {
      continue;
    }

    const createdAt = normalizeDate(user.created_at);
    const updatedAt = normalizeDate(user.updated_at, createdAt);

    await execute(
      `INSERT INTO users (full_name, email, password_hash, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), role = VALUES(role), is_active = VALUES(is_active), updated_at = VALUES(updated_at)`,
      [fullName, email, passwordHash, role, isActive ? 1 : 0, createdAt, updatedAt],
      connection
    );

    const [row] = await execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email],
      connection
    );

    if (!row) {
      continue;
    }

    const newId = row.id;
    const sourceId = user.id || user._id;
    if (sourceId) {
      idMap.set(String(sourceId), newId);
    }
    idMap.set(email, newId);
    restoredCount += 1;
  }

  return { map: idMap, restoredCount };
}

async function restoreInstruments(instruments, connection) {
  const idMap = new Map();
  let restoredCount = 0;

  for (const instrument of instruments) {
    const serialNumber = normalizeString(instrument?.serial_number);
    const name = normalizeString(instrument?.name);
    const instrumentType = normalizeString(instrument?.instrument_type);

    if (!serialNumber || !name || !instrumentType) {
      continue;
    }

    const createdAt = normalizeDate(instrument.created_at);
    const updatedAt = normalizeDate(instrument.updated_at, createdAt);

    await execute(
      `INSERT INTO instruments (name, serial_number, instrument_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), instrument_type = VALUES(instrument_type), updated_at = VALUES(updated_at)`,
      [name, serialNumber, instrumentType, createdAt, updatedAt],
      connection
    );

    const [row] = await execute(
      "SELECT id FROM instruments WHERE serial_number = ? LIMIT 1",
      [serialNumber],
      connection
    );

    if (!row) {
      continue;
    }

    const newId = row.id;
    const sourceId = instrument.id || instrument._id;
    if (sourceId) {
      idMap.set(String(sourceId), newId);
    }
    idMap.set(serialNumber, newId);
    restoredCount += 1;
  }

  return { map: idMap, restoredCount };
}

async function restoreTestRecords(testRecords, maps, connection) {
  let restored = 0;
  let skipped = 0;

  for (const record of testRecords) {
    const sourceId = record.id || record._id;
    const instrumentId = maps.instrumentMap.get(String(record.instrument_id)) || maps.instrumentMap.get(String(record.instrument_id || ""));
    const categoryId = maps.categoryMap.get(String(record.category_id)) || maps.categoryMap.get(String(record.category_id || ""));
    const testerId = maps.userMap.get(String(record.tested_by)) || maps.userMap.get(String(record.tested_by || ""));

    if (!instrumentId || !categoryId || !testerId) {
      skipped += 1;
      continue;
    }

    const testedAt = normalizeDate(record.tested_at);
    const createdAt = normalizeDate(record.created_at, testedAt);
    const updatedAt = normalizeDate(record.updated_at, createdAt);
    const testCount = Number(record.test_count) || 1;
    const result = normalizeString(record.result) || "Fail";
    const repeatedFailureAlert = Boolean(record.repeated_failure_alert);
    const remarks = typeof record.remarks === "string" ? record.remarks : null;

    await execute(
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        continuity_detection = VALUES(continuity_detection),
        resistance_value = VALUES(resistance_value),
        force_value = VALUES(force_value),
        current_value = VALUES(current_value),
        result = VALUES(result),
        repeated_failure_alert = VALUES(repeated_failure_alert),
        remarks = VALUES(remarks),
        tested_by = VALUES(tested_by),
        updated_at = VALUES(updated_at)`,
      [
        instrumentId,
        categoryId,
        record.continuity_detection ? 1 : 0,
        Number(record.resistance_value) || 0,
        Number(record.force_value) || 0,
        Number(record.current_value) || 0,
        result,
        testCount,
        repeatedFailureAlert ? 1 : 0,
        remarks,
        testerId,
        testedAt,
        createdAt,
        updatedAt,
      ],
      connection
    );

    restored += 1;
  }

  return { restored, skipped };
}

async function restoreBackup(payload) {
  if (!payload || typeof payload !== "object") {
    throw new ApiError(400, "Invalid backup payload");
  }

  return transaction(async (connection) => {
    const categoryResult = await restoreCategories(payload.categories || [], connection);
    const userResult = await restoreUsers(payload.users || [], connection);
    const instrumentResult = await restoreInstruments(payload.instruments || [], connection);
    const recordResult = await restoreTestRecords(payload.testRecords || [], {
      categoryMap: categoryResult.map,
      userMap: userResult.map,
      instrumentMap: instrumentResult.map,
    }, connection);

    return {
      restored: true,
      stats: {
        categories: categoryResult.restoredCount,
        users: userResult.restoredCount,
        instruments: instrumentResult.restoredCount,
        testRecords: recordResult.restored,
        skippedTestRecords: recordResult.skipped,
      },
    };
  });
}

module.exports = {
  exportBackup,
  restoreBackup,
};
