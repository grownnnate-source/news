import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import feedRouter from "./routes/feed.js";

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
    service: "ThreadNews API",
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api/feed", feedRouter);

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

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 ThreadNews Backend Server running at: http://localhost:${PORT}`);
  console.log(`📡 Health Check : http://localhost:${PORT}/api/health`);
  console.log(`📰 Telegram Feed: http://localhost:${PORT}/api/feed/telegram/tikvahethiopia`);
  console.log(`🗞️ Aggregated Feed: http://localhost:${PORT}/api/feed\n`);
});
