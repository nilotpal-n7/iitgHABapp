const express = require("express");
const router = express.Router();
const {
  authenticateJWT,
  // eslint-disable-next-line no-unused-vars
  authenticateAdminJWT,
} = require("../../middleware/authenticateJWT.js");

const {
  registerToken,
  sendNotification,
} = require("./notificationController.js");

router.post("/send", sendNotification);
// router.post("/send", authenticateAdminJWT, sendNotification);
router.post("/register-token", authenticateJWT, registerToken);

module.exports = router;
