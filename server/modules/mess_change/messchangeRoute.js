const {
  authenticateJWT,
  authenticateAdminJWT,
} = require("../../middleware/authenticateJWT.js");

const express = require("express");

const {
  getAllMessChangeRequests,
  getAllMessChangeRequestsForAllMess,
  acceptAndRejectByFCFS,
  messChangeRequest,
  messChangeStatus,
} = require("./messchangeController.js");

const messChangeRouter = express.Router();

messChangeRouter.get("/all", getAllMessChangeRequestsForAllMess);
messChangeRouter.get("/status", authenticateJWT, messChangeStatus);
messChangeRouter.post("/reqchange", authenticateJWT, messChangeRequest);
messChangeRouter.post(
  "/accept-all",
  authenticateAdminJWT,
  acceptAndRejectByFCFS
);
messChangeRouter.get("/hostel", authenticateAdminJWT, getAllMessChangeRequests);

module.exports = messChangeRouter;
