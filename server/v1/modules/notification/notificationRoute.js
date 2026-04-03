const express = require("express");
const router = express.Router();
const {
  authenticateJWT,
  authenticateHabOrSMCJWT,
} = require("../../middleware/authenticateJWT.js");

const {
  registerToken,
  sendNotification,
  sendWelcomeNotification,
} = require("./notificationController.js");

// Send notification requires admin authentication (SMC member or HAB)
router.post("/send", authenticateHabOrSMCJWT, sendNotification);
router.post("/register-token", authenticateJWT, registerToken);
// Send welcome notification - called from frontend after FCM token registration
router.post("/welcome", authenticateJWT, sendWelcomeNotification);

module.exports = router;
