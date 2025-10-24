// routes/feedbackRoutes.js

const express = require("express");
const feedbackRouter = express.Router();
const {
  submitFeedback,
  removeFeedback,
  getAllFeedback,
  enableFeedback,
  disableFeedback,
  getFeedbackSettings,
  getFeedbackLeaderboard,
  getFeedbackLeaderboardByMonth, // ✅ NEW
  getAvailableMonths, // ✅ NEW
} = require("./feedbackController");
const { authenticateJWT } = require("../../middleware/authenticateJWT");

// Student routes
feedbackRouter.post("/submit", authenticateJWT, submitFeedback);
feedbackRouter.post("/remove", authenticateJWT, removeFeedback);
feedbackRouter.get("/all", authenticateJWT, getAllFeedback);

// HAB routes
feedbackRouter.get("/settings", getFeedbackSettings);
feedbackRouter.post("/enable", enableFeedback);
feedbackRouter.post("/disable", disableFeedback);
feedbackRouter.get("/leaderboard", getFeedbackLeaderboard);
feedbackRouter.get("/leaderboard-by-month", getFeedbackLeaderboardByMonth); // ✅ NEW
feedbackRouter.get("/months", getAvailableMonths); // ✅ NEW

// Debug route
feedbackRouter.get("/all-admin", getAllFeedback);

module.exports = feedbackRouter;
