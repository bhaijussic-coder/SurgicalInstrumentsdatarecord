const bcrypt = require("bcryptjs");
const { connectMySql, disconnectMySql } = require("../src/db/mysql");
const usersRepository = require("../src/repositories/usersRepository");

function parseArg(name) {
  const index = process.argv.findIndex((arg) => arg === `--${name}`);
  if (index === -1 || index === process.argv.length - 1) {
    return null;
  }
  return process.argv[index + 1];
}

async function run() {
  const fullName = parseArg("name");
  const email = parseArg("email");
  const password = parseArg("password");

  if (!fullName || !email || !password) {
    console.error("Usage: node scripts/createAdmin.js --name \"Admin Name\" --email admin@example.com --password StrongPassword123");
    process.exit(1);
  }

  await connectMySql();

  try {
    const exists = await usersRepository.countUsers();
    if (exists > 0) {
      console.error("A user already exists. This script is only for bootstrap admin creation.");
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await usersRepository.createUser({
      full_name: fullName,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role: "admin",
    });

    console.log("Admin user created successfully.");
    console.log("Email:", email.toLowerCase());
    console.log("Password:", password);
    console.log("Role: admin");
    console.log("You can now log in with these credentials.");
  } catch (error) {
    console.error("Failed to create admin user:", error.message || error);
    process.exit(1);
  } finally {
    await disconnectMySql();
  }
}

run();
