import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import feedRouter from "./routes/feed.js";
import articlesRouter from "./routes/articles.js";
import reactionsRouter from "./routes/reactions.js";
import sourcesRouter from "./routes/sources.js";
import { startScheduler, triggerSync } from "./services/scheduler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ThreadNews API Gateway",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// REST API Routes
app.use("/api/feed", feedRouter);
app.use("/api/articles", articlesRouter);
app.use("/api/reactions", reactionsRouter);
app.use("/api/sources", sourcesRouter);

// On-demand manual sync trigger (useful for testing or webhooks)
app.post("/api/sync", async (req, res) => {
  console.log("[API] Manual sync triggered via HTTP POST");
  triggerSync("manual_api");
  res.json({
    success: true,
    message: "News synchronization job triggered in the background."
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("[Unhandled Error]:", err);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: err.message
  });
});

// Start Server and Background Sync Scheduler
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 ThreadNews Production API running at: http://localhost:${PORT}`);
  console.log(`📡 Health Check     : GET  http://localhost:${PORT}/api/health`);
  console.log(`📰 News Feed        : GET  http://localhost:${PORT}/api/feed?sort=velocity`);
  console.log(`📖 Reader Mode      : GET  http://localhost:${PORT}/api/articles/:id/reader`);
  console.log(`👍 Reactions        : POST http://localhost:${PORT}/api/reactions`);
  console.log(`📋 Sources Listing  : GET  http://localhost:${PORT}/api/sources`);
  console.log(`🔄 Trigger Sync     : POST http://localhost:${PORT}/api/sync`);
  console.log(`======================================================\n`);

  // Start automated background scheduler (runs every 15 mins)
  startScheduler();
});
