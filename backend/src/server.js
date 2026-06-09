const app = require("./app");
const { port, nodeEnv } = require("./config/env");
const { connectMySql, disconnectMySql } = require("./db/mysql");

let server;

async function shutdown(signal, exitCode = 0) {
  // eslint-disable-next-line no-console
  console.log(`${signal} received. Shutting down gracefully...`);

  if (server) {
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
  }

  await disconnectMySql();
  process.exit(exitCode);
}

process.on("uncaughtException", (error) => {
  // eslint-disable-next-line no-console
  console.error("Uncaught exception:", error);
  shutdown("uncaughtException", 1).catch((shutdownError) => {
    // eslint-disable-next-line no-console
    console.error("Shutdown failed after uncaught exception:", shutdownError);
    process.exit(1);
  });
});

process.on("unhandledRejection", (reason) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled promise rejection:", reason);
  shutdown("unhandledRejection", 1).catch((shutdownError) => {
    // eslint-disable-next-line no-console
    console.error("Shutdown failed after unhandled rejection:", shutdownError);
    process.exit(1);
  });
});

async function bootstrap() {
  await connectMySql();

  server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend API running on http://localhost:${port} (${nodeEnv})`);
  });

  process.on("SIGINT", () => {
    shutdown("SIGINT").catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Failed during SIGINT shutdown:", error);
      process.exit(1);
    });
  });

  process.on("SIGTERM", () => {
    shutdown("SIGTERM").catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Failed during SIGTERM shutdown:", error);
      process.exit(1);
    });
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", error);
  process.exit(1);
});