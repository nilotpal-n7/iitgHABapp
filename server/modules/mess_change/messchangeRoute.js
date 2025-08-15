const express = require("express");

const {
  getAllMessChangeRequestsForAllHostels,
  processAllMessChangeRequests,
  getAcceptedStudentsByHostel,
  messChangeRequest,
  messChangeStatus,
  messChangeCancel,
  getMessChangeStatus,
  enableMessChange,
  disableMessChange,
  rejectAllMessChangeRequests,
} = require("./messchangeController.js");

const {authenticateJWT} = require("../../middleware/authenticateJWT.js");

const messChangeRouter = express.Router();

messChangeRouter.get("/all", getAllMessChangeRequestsForAllHostels);
messChangeRouter.get("/status", messChangeStatus);
messChangeRouter.post("/reqchange", authenticateJWT, messChangeRequest);
messChangeRouter.patch("/reqcancel", authenticateJWT, messChangeCancel);
messChangeRouter.post("/process-all", processAllMessChangeRequests);
messChangeRouter.post("/reject-all", rejectAllMessChangeRequests);
messChangeRouter.get(
  "/accepted-students/:hostelName",
  getAcceptedStudentsByHostel
);

// New routes for mess change settings
messChangeRouter.get("/settings", getMessChangeStatus);
messChangeRouter.post("/enable", enableMessChange);
messChangeRouter.post("/disable", disableMessChange);

module.exports = messChangeRouter;
