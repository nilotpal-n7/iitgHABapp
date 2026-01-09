const express = require("express");
const multer = require("multer");
const {
  setProfilePicture,
  getProfilePicture,
  markSetupComplete,
} = require("./profileController.js");
const {
  getSettings,
  enablePhotoChange,
  disablePhotoChange,
} = require("./profileSettingsController.js");
const { authenticateJWT } = require("../../middleware/authenticateJWT.js");

const router = express.Router();

// Use memory storage, we'll stream to OneDrive
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
}); // 4MB limit for simple upload

// Settings routes
router.get("/settings", getSettings);
router.post("/settings/enable-photo-change", enablePhotoChange);
router.post("/settings/disable-photo-change", disablePhotoChange);

/**
 * @swagger
 * /api/profile/picture/set:
 *   post:
 *     summary: Upload user's profile picture
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture updated
 */
router.post(
  "/picture/set",
  upload.single("file"),
  authenticateJWT,
  setProfilePicture
);

/**
 * @swagger
 * /api/profile/picture/get:
 *   get:
 *     summary: Get user's profile picture URL or stream
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Returns URL or image bytes
 */
router.get("/picture/get", authenticateJWT, getProfilePicture);

/** Mark setup complete */
router.post("/setup/complete", authenticateJWT, markSetupComplete);

module.exports = router;
