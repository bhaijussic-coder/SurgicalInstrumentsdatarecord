const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    multipleStatements: true,
  });

  try {
    const schemaPath = path.join(__dirname, "../sql/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    console.log("Executing database schema...");
    await connection.query(schema);
    console.log("✓ Database initialized successfully");
  } catch (error) {
    console.error("✗ Failed to initialize database:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

require("dotenv").config();
initDatabase();
