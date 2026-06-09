const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { allowedOrigins, nodeEnv } = require("./config/env");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const testsRoutes = require("./routes/testsRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const usersRoutes = require("./routes/usersRoutes");

const app = express();
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
  })
);
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(morgan(nodeEnv === "production" ? "combined" : "dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/tests", testsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/users", usersRoutes);

if (nodeEnv === "production") {
  // Serve the built React app from the same service in production.
  app.use(express.static(frontendDistPath));

  app.get(/^\/(?!api).*/, (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    return res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
