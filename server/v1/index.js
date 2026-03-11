//import authRoutes from "./modules/auth/auth.routes.js";

require("dotenv").config({ path: "./.env" });
const { installProcessHandlers } = require("./processHandlers.js");
installProcessHandlers();
console.log("MONGODB_URI from env:", process.env.MONGODB_URI);
const authRoutes = require("./modules/auth/auth.routes.js");
const express = require("express");
const mongoose = require("mongoose");
const userRoute = require("./modules/user/userRoute.js");
const cookieParser = require("cookie-parser");
const feedbackRoute = require("./modules/feedback/feedbackRoute.js");
const hostelRoute = require("./modules/hostel/hostelRoute.js");
const notificationRoute = require("./modules/notification/notificationRoute.js");
const messRoute = require("./modules/mess/messRoute.js");
const logsRoute = require("./modules/mess/ScanLogsRoute.js");
const bugReportRoute = require("./modules/bug_report/bugReportRoute.js");
const roomCleaningRoute = require("./modules/room_cleaning/roomCleaningRoute.js");
const cors = require("cors");
const bodyParser = require("body-parser");
const compression = require("compression");
const schedule = require("node-schedule"); // Required for the Kill Switch
const {
  setDelegatedTokens,
  tokenFilePath,
  initDelegatedGraphRedis,
} = require("./utils/delegatedGraphAuth.js");

// New: build delegated auth URLs for starting consent
const onedrive = require("./config/onedrive.js");
function buildAuthorizeUrl() {
  // For delegated token flow, use a dedicated callback endpoint
  // Use PUBLIC_BASE_URL if available, otherwise try to construct from request
  const baseUrl = process.env.PUBLIC_BASE_URL || "https://hab.codingclub.in";
  const delegatedRedirectUri = `${baseUrl}/api/_debug/graph/callback`;

  const params = new URLSearchParams({
    client_id: onedrive.clientId,
    response_type: "code",
    redirect_uri: delegatedRedirectUri,
    scope:
      (onedrive.graphUserScopes || []).join(" ") || "offline_access User.Read",
    prompt: "consent",
  });
  const tenant = onedrive.authTenant || onedrive.tenantId || "common";
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params.toString()}`;
}

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const messChangeRouter = require("./modules/mess_change/messchangeRoute.js");
const galaRoute = require("./modules/gala/galaRoute.js");
require("dotenv").config();

const app = express();
app.use(bodyParser.json({ limit: "1mb" }));
app.use(
  compression({
    level: 6,
    threshold: 100,
  }),
);

const MONGOdb_uri = process.env.MONGODB_URI;
// Using 3000 as default since Docker routes it internally on this port now
const PORT = process.env.PORT || 3000;

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "IITG HAB API",
      version: "1.0.0",
      description: "API documentation for IITG HAB application",
      contact: {
        name: "API Support",
        email: "md.hassan@iitg.ac.in",
      },
    },
    servers: [
      {
        url: "https://hab.codingclub.in",
        description: "Production server",
      },
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./modules/**/*.js", "index.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "IITG HAB API Documentation",
  }),
);

app.get("/api/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "https://hab.codingclub.in",
      "https://hostel.codingclub.in",
      "https://smc.codingclub.in",
      "http://localhost:5172",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose
  .connect(MONGOdb_uri)
  .then(() => {
    console.log("MongoDB connected");

    // ==========================================
    // PROD UPGRADE: Docker Environment Scheduler Init
    // ==========================================
    if (process.env.IS_ACTIVE_SCHEDULER_NODE === "true") {
      console.log("🌟 Primary Node detected. Starting schedulers...");

      const {
        wednesdayScheduler,
        sundayScheduler,
      } = require("./modules/hostel/hostelScheduler.js");
      wednesdayScheduler();
      sundayScheduler();

      // Initialize automatic schedulers for feedback, mess change, and guest cleanup
      const {
        initializeFeedbackAutoScheduler,
      } = require("./modules/feedback/autoFeedbackScheduler.js");
      const {
        initializeMessChangeAutoScheduler,
      } = require("./modules/mess_change/autoMessChangeScheduler.js");
      const {
        initializeGuestCleanupScheduler,
      } = require("./modules/auth/autoGuestCleanupScheduler.js");

      initializeFeedbackAutoScheduler();
      initializeMessChangeAutoScheduler();
      initializeGuestCleanupScheduler();
    } else {
      console.log("⚠️ Standby/Old Node detected. Schedulers disabled here.");
    }

    // Initialize anonymized user for soft-deleted account references
    const {
      initializeAnonymizedUser,
    } = require("./modules/user/anonymizedUserInit.js");
    initializeAnonymizedUser();
  })
  .catch((err) => console.log(err));

// ==========================================
// PROD UPGRADE: Health Check & Kill Switch
// ==========================================

/**
 * @swagger
 * /health:
 * get:
 * summary: "Active Health check endpoint for Docker"
 */
app.get("/health", (req, res) => {
  if (mongoose.connection.readyState === 1) {
    return res.status(200).send("OK");
  }
  return res.status(503).send("Database booting...");
});

// Internal endpoint triggered by the deploy.js script during an update
app.post("/api/internal/schedulers/stop", (req, res) => {
  console.log("🛑 Received command to halt schedulers. Handoff in progress.");
  try {
    for (const jobName in schedule.scheduledJobs) {
      schedule.scheduledJobs[jobName].cancel();
    }
    console.log("✅ All schedulers halted successfully on this container.");
  } catch (e) {
    console.warn("⚠️ Error halting schedulers:", e);
  }
  res.status(200).send("Schedulers halted.");
});


/**
 * @swagger
 * /:
 * get:
 * summary: "Basic endpoint"
 */
app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/hello", (req, res) => {
  res.send("Hello from server");
});

// user route
app.use("/api/users", userRoute);
app.use("/api/feedback", feedbackRoute);
app.use("/api/auth", authRoutes);
app.use("/api/hostel", hostelRoute);
app.use("/api/notification", notificationRoute);
app.use("/api/mess", messRoute);
app.use("/api/gala", galaRoute);
app.use("/api/mess-change", messChangeRouter);
const profileRouter = require("./modules/profile/profileRoute.js");
app.use("/api/profile", profileRouter);
app.use("/api/logs", logsRoute);
app.use("/api/bug-report", bugReportRoute);
app.use("/api/room-cleaning", roomCleaningRoute);

// Debug route: accept delegated tokens and save to disk for server use
app.post("/api/_debug/graph/delegated-token", async (req, res) => {
  try {
    const { access_token, refresh_token, expires_at } = req.body || {};
    if (!access_token || !refresh_token || !expires_at) {
      return res.status(400).json({
        message: "access_token, refresh_token, expires_at (epoch ms) required",
      });
    }
    await setDelegatedTokens({ access_token, refresh_token, expires_at });
    return res
      .status(200)
      .json({ message: "Delegated tokens saved", path: tokenFilePath });
  } catch (e) {
    return res.status(500).json({
      message: "Failed to save delegated tokens",
      error: String(e.message || e),
    });
  }
});

// Debug route: start delegated auth (prints URL)
app.get("/api/_debug/graph/start", (req, res) => {
  if (!onedrive.clientId) {
    return res.status(400).json({ message: "CLIENT_ID missing" });
  }
  const url = buildAuthorizeUrl();
  return res.status(200).json({ authorizeUrl: url });
});

// Debug route: delegated auth callback (exchange code -> tokens)
app.get("/api/_debug/graph/callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send("Missing code");
    const tokenUrl = `https://login.microsoftonline.com/${
      onedrive.authTenant || onedrive.tenantId || "common"
    }/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append("client_id", onedrive.clientId);
    if (onedrive.clientSecret)
      params.append("client_secret", onedrive.clientSecret);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    const baseUrl = process.env.PUBLIC_BASE_URL || "https://hab.codingclub.in";
    const delegatedRedirectUri = `${baseUrl}/api/_debug/graph/callback`;
    params.append("redirect_uri", delegatedRedirectUri);
    params.append(
      "scope",
      (onedrive.graphUserScopes || []).join(" ") || "offline_access User.Read",
    );

    const axios = require("axios");
    const { data } = await axios.post(tokenUrl, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const expiresAt = Date.now() + Number(data.expires_in || 3600) * 1000;
    await setDelegatedTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: expiresAt,
    });
    res
      .status(200)
      .send(
        `Delegated tokens saved at ${tokenFilePath}. You can close this window.`,
      );
  } catch (e) {
    res.status(500).send(`Failed to exchange code: ${e.message}`);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("[Express error]", err);
  res.status(500).json({ message: "Internal server error" });
});

const { initMessManagerWs } = require("./modules/mess/messManagerWs.js");
const { initGalaManagerWs } = require("./modules/gala/galaManagerWs.js");

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Initialize WebSocket servers for manager live scan logs
initMessManagerWs(server);
initGalaManagerWs(server);

// Subscribe to Redis scan events
const { initScanBroadcast } = require("./utils/scanBroadcast.js");
initScanBroadcast();

// Connect to Redis
initDelegatedGraphRedis();

// ==========================================
// PROD UPGRADE: Graceful Shutdown Hook
// ==========================================
process.on('SIGTERM', () => {
  console.log('💀 SIGTERM received. Shutting down gracefully...');
  
  // 1. Force halt any lingering schedulers
  try {
    for (const jobName in schedule.scheduledJobs) {
      schedule.scheduledJobs[jobName].cancel();
    }
  } catch(e) {}

  // 2. Stop taking new HTTP requests, finish existing ones
  server.close(() => {
    console.log('✅ All pending HTTP requests finished.');
    
    // 3. Cleanly close database connections
    mongoose.connection.close(false).then(() => {
      console.log('✅ MongoDB connection closed. Exiting.');
      process.exit(0);
    });
  });
});

module.exports = app;
