const express = require("express");
const router = express.Router();
const {
  authenticateJWT,
  authenticateAdminJWT,
} = require("../../middleware/authenticateJWT.js");

const {
  registerToken,
  sendNotification,
} = require("./notificationController.js");

// Send notification requires admin authentication (hostel office or HAB)
router.post("/send", authenticateAdminJWT, sendNotification);
router.post("/register-token", authenticateJWT, registerToken);

module.exports = router;
