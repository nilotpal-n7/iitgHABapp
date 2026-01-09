const express = require("express");

// Import from modular controllers
const {
  messChangeRequest,
  messChangeStatus,
} = require("./controllers/requestController.js");

const {
  processAllMessChangeRequests,
  rejectAllMessChangeRequests,
} = require("./controllers/processingController.js");

const {
  getAllMessChangeRequestsForAllHostels,
  messChangeStatusForAdmin,
  enableMessChange,
  disableMessChange,
  getMessChangeScheduleInfo,
} = require("./controllers/adminController.js");

const { authenticateJWT } = require("../../middleware/authenticateJWT.js");
const { requireMicrosoftAuth } = require("../../middleware/requireMicrosoftAuth.js");

const messChangeRouter = express.Router();

// User routes - require Microsoft account linking
messChangeRouter.get("/status", authenticateJWT, requireMicrosoftAuth, messChangeStatus);
messChangeRouter.post("/reqchange", authenticateJWT, requireMicrosoftAuth, messChangeRequest);

// Admin routes
messChangeRouter.get("/all", getAllMessChangeRequestsForAllHostels);
messChangeRouter.post("/process-all", processAllMessChangeRequests);
messChangeRouter.post("/reject-all", rejectAllMessChangeRequests);
messChangeRouter.get("/settings", messChangeStatusForAdmin);
messChangeRouter.get("/schedule", getMessChangeScheduleInfo);
messChangeRouter.post("/enable", enableMessChange);
messChangeRouter.post("/disable", disableMessChange);

module.exports = messChangeRouter;
