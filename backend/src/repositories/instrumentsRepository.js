const { execute } = require("../db/mysql");

async function getInstrumentBySerial(serialNumber, connection = null) {
  const rows = await execute(
    "SELECT id, name, serial_number, instrument_type, created_at, updated_at FROM instruments WHERE serial_number = ? LIMIT 1",
    [serialNumber],
    connection
  );
  return rows[0] || null;
}

async function upsertInstrument({ instrumentName, serialNumber, instrumentType }, connection = null) {
  const result = await execute(
    `INSERT INTO instruments (name, serial_number, instrument_type, created_at, updated_at)
     VALUES (?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE name = VALUES(name), instrument_type = VALUES(instrument_type), updated_at = NOW()`,
    [instrumentName, serialNumber, instrumentType],
    connection
  );

  const instrumentId = result.insertId || (await getInstrumentBySerial(serialNumber, connection)).id;
  return {
    id: instrumentId,
    name: instrumentName,
    serial_number: serialNumber,
    instrument_type: instrumentType,
  };
}

module.exports = {
  getInstrumentBySerial,
  upsertInstrument,
};
