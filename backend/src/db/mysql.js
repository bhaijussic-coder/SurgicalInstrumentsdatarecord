const mysql = require("mysql2/promise");
const {
  mysqlHost,
  mysqlPort,
  mysqlUser,
  mysqlPassword,
  mysqlDatabase,
  mysqlPoolLimit,
} = require("../config/env");

let pool;

async function seedDefaultCategories() {
  const defaults = ["Fresh", "Rework", "For Trial"];
  await pool.query(
    "INSERT IGNORE INTO categories (name) VALUES ?",
    [defaults.map((name) => [name])]
  );
}

async function connectMySql() {
  if (pool) {
    return;
  }

  pool = mysql.createPool({
    host: mysqlHost,
    port: mysqlPort,
    user: mysqlUser,
    password: mysqlPassword,
    database: mysqlDatabase,
    waitForConnections: true,
    connectionLimit: mysqlPoolLimit,
    queueLimit: 0,
    dateStrings: false,
  });

  try {
    await pool.query("SELECT 1");
    await seedDefaultCategories();
  } catch (error) {
    if (pool) {
      await pool.end();
      pool = null;
    }
    throw error;
  }
}

async function disconnectMySql() {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
}

function getPool() {
  if (!pool) {
    throw new Error("MySQL pool has not been initialized. Call connectMySql() before using the database.");
  }
  return pool;
}

async function execute(sql, params = [], connection = null) {
  if (connection && typeof connection.execute === "function") {
    const [rows] = await connection.execute(sql, params);
    return rows;
  }

  const [rows] = await getPool().execute(sql, params);
  return rows;
}

async function transaction(callback) {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  connectMySql,
  disconnectMySql,
  execute,
  transaction,
};
