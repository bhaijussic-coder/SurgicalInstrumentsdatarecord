const { connectMySql, disconnectMySql } = require("../src/db/mysql");

async function testConnection() {
  try {
    await connectMySql();
    console.log("MySQL connection successful.");
  } catch (error) {
    console.error("MySQL connection failed:", error.message || error);
    process.exit(1);
  } finally {
    await disconnectMySql();
  }
}

testConnection();
