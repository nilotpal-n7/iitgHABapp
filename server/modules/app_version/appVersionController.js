const fs = require("fs");
const path = require("path");

// Common config file - same directory
const configPath = path.join(__dirname, "./config/appVersion.json");

/**
 * Read version config from JSON file
 */
const getVersionConfig = () => {
  try {
    const data = fs.readFileSync(configPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading version config:", error);
    return {
      android: {
        minVersionv1: "1.0.0",
        minVersionv2: "1.0.0",
        storeUrl: "",
        updateMessage: "A new version is available. Please update to continue.",
      },
      ios: {
        minVersionv1: "1.0.0",
        minVersionv2: "1.0.0",
        storeUrl: "",
        updateMessage: "A new version is available. Please update to continue.",
      },
    };
  }
};

/**
 * Save version config to JSON file
 */
const saveVersionConfig = (config) => {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving version config:", error);
    return false;
  }
};

/**
 * Get version info for a specific platform (returns both v1 and v2)
 */
const getVersionInfo = (req, res) => {
  try {
    const { platform } = req.params;

    if (!["android", "ios"].includes(platform.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid platform. Must be 'android' or 'ios'.",
      });
    }

    const config = getVersionConfig();
    const platformKey = platform.toLowerCase();
    const platformConfig = config[platformKey];

    return res.status(200).json({
      success: true,
      data: {
        platform: platformKey,
        v1: {
          minVersion: platformConfig.minVersionv1,
          storeUrl: platformConfig.storeUrl,
          updateMessage: platformConfig.updateMessage,
        },
        v2: {
          minVersion: platformConfig.minVersionv2,
          storeUrl: platformConfig.storeUrl,
          updateMessage: platformConfig.updateMessage,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching version info:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch version info",
      error: error.message,
    });
  }
};

/**
 * Update version info for a specific platform (Admin only)
 */
const updateVersionInfo = (req, res) => {
  try {
    const { platform } = req.params;
    const { minVersionv1, minVersionv2, storeUrl, updateMessage } = req.body;

    if (!["android", "ios"].includes(platform.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid platform. Must be 'android' or 'ios'.",
      });
    }

    const config = getVersionConfig();
    const platformKey = platform.toLowerCase();

    if (minVersionv1) config[platformKey].minVersionv1 = minVersionv1;
    if (minVersionv2) config[platformKey].minVersionv2 = minVersionv2;
    if (storeUrl) config[platformKey].storeUrl = storeUrl;
    if (updateMessage) config[platformKey].updateMessage = updateMessage;

    if (saveVersionConfig(config)) {
      return res.status(200).json({
        success: true,
        message: "Version info updated successfully",
        data: config[platformKey],
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to save version config",
      });
    }
  } catch (error) {
    console.error("Error updating version info:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update version info",
      error: error.message,
    });
  }
};

/**
 * Get all version info
 */
const getAllVersionInfo = (req, res) => {
  try {
    const config = getVersionConfig();
    return res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Error fetching all version info:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch version info",
      error: error.message,
    });
  }
};

module.exports = {
  getVersionInfo,
  updateVersionInfo,
  getAllVersionInfo,
};
