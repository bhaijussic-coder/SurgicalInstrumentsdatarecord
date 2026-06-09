const fs = require("fs");
const path = require("path");
const { connectMySql, disconnectMySql } = require("../src/db/mysql");
const backupService = require("../src/services/backupService");

function parseArg(name) {
  const index = process.argv.findIndex((arg) => arg === `--${name}`);
  if (index === -1 || index === process.argv.length - 1) {
    return null;
  }
  return process.argv[index + 1];
}

async function run() {
  const filePath = parseArg("file") || process.argv[2];
  if (!filePath) {
    console.error("Usage: node scripts/importBackupToMysql.js --file backup.json");
    process.exit(1);
  }

  const absolutePath = path.resolve(process.cwd(), filePath);
  const content = fs.readFileSync(absolutePath, "utf8");
  const payload = JSON.parse(content);

  await connectMySql();

  try {
    const result = await backupService.restoreBackup(payload);
    console.log("Backup import completed:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Backup import failed:", error.message || error);
    process.exit(1);
  } finally {
    await disconnectMySql();
  }
}

run();
