const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");
require("dotenv").config();

async function setPassword() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  const testPassword = "test123";
  const hash = await bcrypt.hash(testPassword, 10);

  await connection.query(
    "UPDATE users SET password_hash = ? WHERE email = ?",
    [hash, "abc@example.com"]
  );

  console.log("✓ Password updated to: test123");
  await connection.end();
}

setPassword().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
