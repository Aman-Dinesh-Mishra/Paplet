import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db/pool.js";
import documentsRouter from "./routes/documents.js";
const app = express();
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN ?? "http://localhost:5173",
  }),
);
app.use(express.json());

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

app.use("/documents", documentsRouter);
const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Paplet API listening on http://localhost:${port}`);
});
