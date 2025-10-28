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
  getFeedbackSettingsPublic,
  getFeedbackLeaderboard,
  getFeedbackLeaderboardByWindow,
  getAvailableWindows,
  checkFeedbackSubmitted,
  getFeedbackWindowTimeLeft,
} = require("./feedbackController");
const { authenticateJWT } = require("../../middleware/authenticateJWT");

// Student routes
feedbackRouter.post("/submit", authenticateJWT, submitFeedback);
feedbackRouter.post("/remove", authenticateJWT, removeFeedback);
feedbackRouter.get("/all", authenticateJWT, getAllFeedback);
feedbackRouter.get("/submitted", authenticateJWT, checkFeedbackSubmitted);
feedbackRouter.get("/settings-public", getFeedbackSettingsPublic); // Public endpoint for mobile app

// HAB routes
feedbackRouter.get("/settings", getFeedbackSettings);
feedbackRouter.post("/enable", enableFeedback);
feedbackRouter.post("/disable", disableFeedback);
feedbackRouter.get("/leaderboard", authenticateJWT, getFeedbackLeaderboard);
feedbackRouter.get("/leaderboard-by-window", getFeedbackLeaderboardByWindow);
feedbackRouter.get("/windows", getAvailableWindows);
feedbackRouter.get("/window-time-left", getFeedbackWindowTimeLeft);

// Debug route
feedbackRouter.get("/all-admin", getAllFeedback);

module.exports = feedbackRouter;
