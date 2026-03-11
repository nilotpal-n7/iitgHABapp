// server/index.js (The Gateway)
require("dotenv").config();
const { installProcessHandlers } = require("./processHandlers.js");
installProcessHandlers();

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const {
  appVersionRouter,
  hqAppVersionRouter,
} = require("./modules/app_version/appVersionRoute.js");

const app = express();
const PORT = process.env.PORT || 3000; 

// ==========================================
// 1. DYNAMIC ROUTING STATE
// ==========================================
const routesPath = path.join(__dirname, "routes.json");
let targets = {};

// PROD UPGRADE: Safely load initial routes so an empty file doesn't crash the Gateway on boot
try {
  if (fs.existsSync(routesPath)) {
    targets = JSON.parse(fs.readFileSync(routesPath, "utf-8"));
  }
} catch (e) {
  console.warn("⚠️ Initial routes.json is empty or invalid. Gateway starting with no active targets.");
}

// Watch the JSON file for live zero-downtime updates
fs.watchFile(routesPath, { interval: 1000 }, () => {
  try {
    const updatedTargets = JSON.parse(fs.readFileSync(routesPath, "utf-8"));
    // Only update memory if parse succeeds, preventing crashes from partial file writes
    targets = updatedTargets;
    console.log(`🔄 [Gateway] Routing updated dynamically:`, targets);
  } catch (err) {
    console.error("❌ Error parsing routes.json during update:", err.message);
  }
});

// ==========================================
// 2. GLOBAL MIDDLEWARE
// ==========================================
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        "https://hab.codingclub.in",
        "https://hostel.codingclub.in",
        "https://smc.codingclub.in",
        "http://localhost:5172",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
      ];
      // Allow all origins for development/mobile apps
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-api-version",
      "X-Requested-With",
    ],
  }),
);

// Optional: Slim logging for production (only log basic hits, not massive payloads)
app.use((req, res, next) => {
  console.log(`[Gateway] ${req.method} ${req.url} | Version Header: ${req.headers["x-api-version"] || "none"}`);
  next();
});

// ==========================================
// 3. CENTRALIZED GATEWAY ROUTES
// ==========================================
// These routes are handled directly by the Gateway, bypassing the Proxy
app.use("/api/app-version", appVersionRouter);
app.use("/api/hq-app-version", hqAppVersionRouter);

// ==========================================
// 4. FAIL-SAFE AVAILABILITY CHECK
// ==========================================
// PROD UPGRADE: Prevent the proxy from hanging if no target is available
app.use((req, res, next) => {
  const headerVersion = req.headers["x-api-version"];
  const activeTarget = targets[headerVersion] || targets.default;

  if (!activeTarget) {
    return res.status(503).json({
      error: "Service Unavailable",
      message: "The API is currently deploying or temporarily offline. Please try again in a few seconds."
    });
  }
  next();
});

// ==========================================
// 5. THE PROXY
// ==========================================
const selectProxyTarget = (req) => {
  const headerVersion = req.headers["x-api-version"];
  return targets[headerVersion] || targets.default;
};

const apiProxy = createProxyMiddleware({
  target: "http://127.0.0.1:65535", // Dummy fallback target (required by library). Overridden by router.
  changeOrigin: true,
  router: selectProxyTarget,
  ws: true, // Support WebSockets seamlessly
  logLevel: "error", // PROD UPGRADE: 'debug' will flood your disk in production. Use 'error'.
  
  // PROD UPGRADE: Handle upstream crashes gracefully without taking down the gateway
  onError: (err, req, res) => {
    console.error(`[Proxy Error] Failed to reach upstream:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({
        error: "Bad Gateway",
        message: "The upstream server failed to respond."
      });
    }
  }
});

app.use("/", apiProxy);

// ==========================================
// 6. BOOT & GRACEFUL SHUTDOWN
// ==========================================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Gateway running on PORT ${PORT} (0.0.0.0)`);
  console.log(`🗺️  Current Active Routes:`);
  if (Object.keys(targets).length === 0) {
    console.log(`   ⚠️ No routes active yet. Waiting for deployments...`);
  } else {
    for (const [version, url] of Object.entries(targets)) {
      console.log(`   -> ${version === 'default' ? '⭐ default' : `🏷️  ${version}`.padEnd(10)} : ${url}`);
    }
  }
  console.log(""); // Empty line for clean logs
});

// Catch Docker SIGTERM to allow active proxy requests to finish draining
process.on('SIGTERM', () => {
  console.log('💀 SIGTERM received. Shutting down Gateway gracefully...');
  server.close(() => {
    console.log('✅ All proxy connections closed. Exiting.');
    process.exit(0);
  });
});
