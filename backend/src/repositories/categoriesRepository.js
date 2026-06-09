const { execute } = require("../db/mysql");

async function getCategoryByName(name, connection = null) {
  const rows = await execute("SELECT id, name FROM categories WHERE name = ? LIMIT 1", [name], connection);
  return rows[0] || null;
}

async function getCategoryIdByName(name, connection = null) {
  const category = await getCategoryByName(name, connection);
  return category ? category.id : null;
}

async function listCategories(connection = null) {
  return execute("SELECT id, name FROM categories ORDER BY id ASC", [], connection);
}

module.exports = {
  getCategoryByName,
  getCategoryIdByName,
  listCategories,
};
