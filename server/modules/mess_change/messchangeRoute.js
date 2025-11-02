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

const messChangeRouter = express.Router();

// User routes
messChangeRouter.get("/status", authenticateJWT, messChangeStatus);
messChangeRouter.post("/reqchange", authenticateJWT, messChangeRequest);

// Admin routes
messChangeRouter.get("/all", getAllMessChangeRequestsForAllHostels);
messChangeRouter.post("/process-all", processAllMessChangeRequests);
messChangeRouter.post("/reject-all", rejectAllMessChangeRequests);
messChangeRouter.get("/settings", messChangeStatusForAdmin);
messChangeRouter.get("/schedule", getMessChangeScheduleInfo);
messChangeRouter.post("/enable", enableMessChange);
messChangeRouter.post("/disable", disableMessChange);

module.exports = messChangeRouter;
