const { execute } = require("../db/mysql");

async function countUsers(connection = null) {
  const [row] = await execute("SELECT COUNT(*) AS total FROM users", [], connection);
  return row?.total || 0;
}

async function countActiveAdmins(connection = null) {
  const [row] = await execute(
    "SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND is_active = 1",
    [],
    connection
  );
  return row?.total || 0;
}

async function findByEmail(email, connection = null) {
  const rows = await execute(
    "SELECT id, full_name, email, password_hash, role, is_active, created_at, updated_at FROM users WHERE email = ? LIMIT 1",
    [email],
    connection
  );
  return rows[0] || null;
}

async function findById(id, connection = null) {
  const rows = await execute(
    "SELECT id, full_name, email, password_hash, role, is_active, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
    [id],
    connection
  );
  return rows[0] || null;
}

async function listUsers(connection = null) {
  return execute(
    "SELECT id, full_name, email, role, is_active, created_at FROM users ORDER BY created_at DESC",
    [],
    connection
  );
}

async function listActiveTesters(connection = null) {
  return execute(
    "SELECT id, full_name FROM users WHERE is_active = 1 AND role IN ('admin', 'tester') ORDER BY full_name ASC",
    [],
    connection
  );
}

async function createUser({ full_name, email, password_hash, role }, connection = null) {
  const result = await execute(
    `INSERT INTO users (full_name, email, password_hash, role, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
    [full_name, email, password_hash, role],
    connection
  );

  return findById(result.insertId, connection);
}

async function updateUserStatus(id, isActive, connection = null) {
  await execute(
    "UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?",
    [isActive ? 1 : 0, id],
    connection
  );
  return findById(id, connection);
}

module.exports = {
  countUsers,
  countActiveAdmins,
  findByEmail,
  findById,
  listUsers,
  listActiveTesters,
  createUser,
  updateUserStatus,
};
