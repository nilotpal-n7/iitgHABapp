const express = require("express");

const {
  getAllMessChangeRequestsForAllHostels,
  processAllMessChangeRequests,
  getAcceptedStudentsByHostel,
  messChangeRequest,
  messChangeStatus,
} = require("./messchangeController.js");

const messChangeRouter = express.Router();

messChangeRouter.get("/all", getAllMessChangeRequestsForAllHostels);
messChangeRouter.get("/status", messChangeStatus);
messChangeRouter.post("/reqchange", messChangeRequest);
messChangeRouter.post("/process-all", processAllMessChangeRequests);
messChangeRouter.get(
  "/accepted-students/:hostelName",
  getAcceptedStudentsByHostel
);

module.exports = messChangeRouter;
