// routes/feedbackRoutes.js

const express = require("express");
const feedbackRouter = express.Router();
const {
  submitFeedback,
  // removeFeedback,
  // getAllFeedback,
  enableFeedback,
  disableFeedback,
  getFeedbackSettings,
  // getFeedbackSettingsPublic,
  // getFeedbackLeaderboard,
  getFeedbackLeaderboardByWindow,
  getAvailableWindows,
  checkFeedbackSubmitted,
  getFeedbackWindowTimeLeft,
  getFeedbacksByCaterer,
} = require("./feedbackController");
const { authenticateJWT } = require("../../middleware/authenticateJWT");
const {
  requireMicrosoftAuth,
} = require("../../middleware/requireMicrosoftAuth");

// Student routes - require Microsoft account linking
feedbackRouter.post(
  "/submit",
  authenticateJWT,
  requireMicrosoftAuth,
  submitFeedback
);
// feedbackRouter.post("/remove", authenticateJWT, requireMicrosoftAuth, removeFeedback);
// feedbackRouter.get("/all", authenticateJWT, requireMicrosoftAuth, getAllFeedback);
feedbackRouter.get(
  "/submitted",
  authenticateJWT,
  requireMicrosoftAuth,
  checkFeedbackSubmitted
);
// feedbackRouter.get("/settings-public", getFeedbackSettingsPublic);

// HAB routes
feedbackRouter.get("/settings", getFeedbackSettings);
feedbackRouter.post("/enable", enableFeedback);
feedbackRouter.post("/disable", disableFeedback);
// feedbackRouter.get("/leaderboard", authenticateJWT, getFeedbackLeaderboard);
feedbackRouter.get("/leaderboard-by-window", getFeedbackLeaderboardByWindow);
feedbackRouter.get("/windows", getAvailableWindows);
feedbackRouter.get("/window-time-left", getFeedbackWindowTimeLeft);
feedbackRouter.get("/by-caterer", getFeedbacksByCaterer);

// feedbackRouter.get("/all-admin", getAllFeedback);

module.exports = feedbackRouter;
