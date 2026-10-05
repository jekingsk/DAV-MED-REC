require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { initKeepAliveCron, getKeepAliveStatus } = require("./services/keepAliveCron");
const { ensureMedicalProofsDir } = require("./services/proofSync");
const { initFirebase } = require("./services/firebase");

// Initialize directories and database services
ensureMedicalProofsDir();
initFirebase();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration (Permits Vercel frontend, local dev, or any authorized origin)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      // In production, allow all vercel.app preview and production domains, localhost, or specified FRONTEND_URL
      if (
        process.env.FRONTEND_URL &&
        (origin === process.env.FRONTEND_URL || origin.startsWith(process.env.FRONTEND_URL))
      ) {
        return callback(null, true);
      }
      if (
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
      ) {
        return callback(null, true);
      }
      // Permissive by default so Vercel can connect seamlessly
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-uid"],
  })
);

// Body parsers (50MB limit to handle medical certificate images/PDFs seamlessly)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path !== "/health" && req.path !== "/api/health") {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// ==============================================================================
// 1. HEALTH CHECK & KEEP-ALIVE ENDPOINTS (Crucial for Render & Cron Jobs)
// ==============================================================================
const startTime = Date.now();

const healthHandler = (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const keepAlive = getKeepAliveStatus();

  return res.status(200).json({
    status: "ok",
    service: "DAV University Medical Leave Portal Backend",
    environment: process.env.NODE_ENV || "production",
    uptime: `${uptimeSeconds}s`,
    timestamp: new Date().toISOString(),
    keepAlive,
    message: "Server is online, responsive, and ready.",
  });
};

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>DAV University Medical Leave Portal - Backend API</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; background: #0f172a; color: #f8fafc; text-align: center; }
          .card { max-width: 600px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 12px; border: 1px solid #334155; }
          h1 { color: #38bdf8; margin-top: 0; font-size: 24px; }
          .badge { display: inline-block; padding: 6px 14px; background: #059669; color: white; border-radius: 9999px; font-weight: bold; font-size: 14px; margin-bottom: 20px; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
          a { color: #38bdf8; text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">API ACTIVE & ONLINE</div>
          <h1>DAV University Medical Portal Backend</h1>
          <p>Running continuously on Render with automated keep-alive cron integration.</p>
          <p><a href="/health">View Health Status (/health)</a></p>
        </div>
      </body>
    </html>
  `);
});

// ==============================================================================
// 2. MOUNT API ROUTES
// ==============================================================================
const authRoutes = require("./routes/auth");
const applicationsRoutes = require("./routes/applications");
const statsRoutes = require("./routes/stats");
const studentsRoutes = require("./routes/students");
const templateRoutes = require("./routes/template");
const trackRoutes = require("./routes/track");
const syncRoutes = require("./routes/sync");
const adminRoutes = require("./routes/admin");
const proofsRoutes = require("./routes/proofs");

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/template", templateRoutes);
app.use("/api/track", trackRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", proofsRoutes);
app.use("/", proofsRoutes); // Supports /medical-proofs/:filename

// 404 handler for undefined API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("[ServerError]", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// Start listening
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`[DAV Medical Portal Backend] Running on port: ${PORT}`);
  console.log(`[Health Endpoint] http://localhost:${PORT}/health`);
  console.log(`=======================================================`);

  // Initialize automated keep-alive cron job
  initKeepAliveCron();
});

module.exports = server;
