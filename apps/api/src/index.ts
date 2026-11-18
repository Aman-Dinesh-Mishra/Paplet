import "dotenv/config";
import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pool } from "./db/pool.js";
import documentsRouter from "./routes/documents.route.js";
import searchRouter from "./routes/search.route.js";
import askRouter from "./routes/ask.route.js";
import {
  apiLimiter,
  askLimiter,
  uploadLimiter,
} from "./middleware/rate-limit.middleware.js";
import { requestLogger } from "./middleware/logger.middleware.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN ?? "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.use(requestLogger);
app.use(express.json({ limit: "32kb" }));
app.use(apiLimiter);

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      db: "connected",
      time: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: "error",
      db: "disconnected",
      time: new Date().toISOString(),
    });
  }
});

app.use("/documents", uploadLimiter, documentsRouter);
app.use("/search", searchRouter);
app.use("/ask", askLimiter, askRouter);

app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);

const server = createServer(app);

server.requestTimeout = 120_000;
server.headersTimeout = 30_000;
server.keepAliveTimeout = 5_000;

server.listen(port, () => {
  console.log(`Paplet API listening on http://localhost:${port}`);
});

let isShuttingDown = false;

const shutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`${signal} received. Starting graceful shutdown...`);

  server.close(async (error) => {
    if (error) {
      console.error("Error closing HTTP server:", error);
      process.exitCode = 1;
    }

    try {
      await pool.end();
      console.log("PostgreSQL connection pool closed.");
    } catch (poolError) {
      console.error("Error closing PostgreSQL pool:", poolError);
      process.exitCode = 1;
    }
  });
};

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});
