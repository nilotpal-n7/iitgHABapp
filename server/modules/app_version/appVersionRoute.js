const express = require("express");
const router = express.Router();
const {
  getVersionInfo,
  updateVersionInfo,
  getAllVersionInfo,
} = require("./appVersionController");

/**
 * @swagger
 * /api/app-version/{platform}:
 *   get:
 *     summary: Get app version info for a platform
 *     tags: [App Version]
 *     parameters:
 *       - in: path
 *         name: platform
 *         required: true
 *         schema:
 *           type: string
 *           enum: [android, ios]
 *         description: The platform (android or ios)
 *     responses:
 *       200:
 *         description: Version info retrieved successfully
 *       400:
 *         description: Invalid platform
 *       500:
 *         description: Server error
 */
router.get("/:platform", getVersionInfo);

/**
 * @swagger
 * /api/app-version/{platform}:
 *   put:
 *     summary: Update app version info for a platform (Admin only)
 *     tags: [App Version]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: platform
 *         required: true
 *         schema:
 *           type: string
 *           enum: [android, ios]
 *         description: The platform (android or ios)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               minVersion:
 *                 type: string
 *                 example: "1.0.0"
 *               latestVersion:
 *                 type: string
 *                 example: "1.2.0"
 *               storeUrl:
 *                 type: string
 *                 example: "https://play.google.com/store/apps/details?id=com.example.app"
 *               forceUpdate:
 *                 type: boolean
 *                 example: true
 *               updateMessage:
 *                 type: string
 *                 example: "Please update to the latest version"
 *     responses:
 *       200:
 *         description: Version info updated successfully
 *       400:
 *         description: Invalid platform
 *       500:
 *         description: Server error
 */
router.put("/:platform", updateVersionInfo);

/**
 * @swagger
 * /api/app-version:
 *   get:
 *     summary: Get all app version info (Admin only)
 *     tags: [App Version]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All version info retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/", getAllVersionInfo);

module.exports = router;
