const { execute } = require("./src/db/mysql");
require("dotenv").config();

async function testQuery() {
  try {
    // Test the exact query that's failing
    const pageSize = 10;
    const offset = 0;
    const params = [];
    const where = ["1 = 1"];
    
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
    ORDER BY tr.tested_at DESC, tr.id DESC
    LIMIT ?, ?`;

    console.log("Query:", dataQuery);
    console.log("Params:", [...params, Number(offset), Number(pageSize)]);
    
    const { connectMySql, disconnectMySql } = require("./src/db/mysql");
    await connectMySql();
    
    const rows = await execute(dataQuery, [...params, Number(offset), Number(pageSize)]);
    console.log("Success! Rows:", rows);
    
    await disconnectMySql();
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Full error:", error);
  }
}

testQuery();
