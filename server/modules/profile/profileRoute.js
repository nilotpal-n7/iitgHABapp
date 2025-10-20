const express = require("express");
const multer = require("multer");
const { authenticateJWT } = require("../../middleware/authenticateJWT.js");
const {
  setProfilePicture,
  getProfilePicture,
} = require("./profileController.js");

const router = express.Router();

// Use memory storage, we'll stream to OneDrive
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
}); // 4MB limit for simple upload

/**
 * @swagger
 * /api/profile/picture/set:
 *   post:
 *     summary: Upload user's profile picture
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
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
  authenticateJWT,
  upload.single("file"),
  setProfilePicture
);

/**
 * @swagger
 * /api/profile/picture/get:
 *   get:
 *     summary: Get user's profile picture URL or stream
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns URL or image bytes
 */
router.get("/picture/get", authenticateJWT, getProfilePicture);

module.exports = router;
