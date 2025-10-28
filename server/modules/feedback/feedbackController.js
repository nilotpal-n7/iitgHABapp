const { User } = require("../user/userModel");
const { Hostel } = require("../hostel/hostelModel");
const Feedback = require("./feedbackModel");
const { FeedbackSettings } = require("./feedbackSettingsModel");

const ratingMap = {
  "Very Poor": 1,
  Poor: 2,
  Average: 3,
  Good: 4,
  "Very Good": 5,
};

// ==========================================
// Submit feedback
// ==========================================
const submitFeedback = async (req, res) => {
  console.log("request received");
  try {
    const { name, rollNumber, breakfast, lunch, dinner, comment, smcFields } =
      req.body;
    console.log("Received feedback:", req.body);
    if (!name || !rollNumber || !breakfast || !lunch || !dinner) {
      return res.status(400).send("Incomplete feedback data");
    }

    // Enforce feedback window
    let settings = await FeedbackSettings.findOne();
    if (!settings || !settings.isEnabled) {
      return res.status(403).send("Mess feedback is currently closed by HAB.");
    }

    // Auto close after 2 days
    if (settings.enabledAt) {
      const enabledAt = new Date(settings.enabledAt);
      const expiresAt = new Date(enabledAt.getTime() + 2 * 24 * 60 * 60 * 1000);
      const now = new Date();
      if (now > expiresAt) {
        settings.isEnabled = false;
        settings.disabledAt = now;
        await settings.save();
        return res.status(403).send("Mess feedback window has ended.");
      }
    }

    // Find user
    const user = await User.findOne({ name, rollNumber });
    if (!user) return res.status(404).send("User not found");

    // Check if feedback for this user and current window already exists
    if (user.isFeedbackSubmitted) {
      return res.status(400).send("Feedback already submitted for this window");
    }

    // Prepare feedback data
    const feedbackData = {
      user: user._id,
      breakfast,
      lunch,
      dinner,
      comment,
      date: new Date(),
      feedbackWindowNumber: settings.currentWindowNumber,
    };

    // Resolve caterer (mess) ID from user's subscribed mess (hostel)
    let catererId = null;
    if (user.curr_subscribed_mess) {
      const hostelDoc = await Hostel.findById(user.curr_subscribed_mess).lean();
      catererId = hostelDoc?.messId || null;
    }
    feedbackData.caterer = catererId;

    // Include SMC fields only for SMC members
    if (user.isSMC) {
      if (!smcFields) {
        return res
          .status(400)
          .send("SMC users must provide extra feedback fields");
      }
      feedbackData.smcFields = smcFields;
    }

    const feedback = new Feedback(feedbackData);
    await feedback.save();

    // Mark feedback as submitted for this window
    user.isFeedbackSubmitted = true;
    await user.save();

    res.status(200).send("Feedback submitted successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving feedback");
  }
};

// ==========================================
// Remove feedback
// ==========================================
const removeFeedback = async (req, res) => {
  try {
    const { name, rollNumber } = req.body;
    if (!name || !rollNumber) {
      return res.status(400).send("Name and Roll Number required");
    }

    const user = await User.findOne({ name, rollNumber });
    if (!user) return res.status(404).send("User not found");

    if (!user.isFeedbackSubmitted) {
      return res.status(400).send("No feedback submitted by this user");
    }

    // Get current window number
    const settings = await FeedbackSettings.findOne();
    const currentWindowNumber = settings?.currentWindowNumber || 1;

    await Feedback.deleteOne({
      user: user._id,
      feedbackWindowNumber: currentWindowNumber,
    });
    user.isFeedbackSubmitted = false;
    await user.save();

    res.status(200).send("Feedback removed successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error removing feedback");
  }
};

// ==========================================
// Get all feedbacks
// ==========================================
const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("user", "name rollNumber isSMC")
      .populate("caterer", "name")
      .sort({ date: -1 })
      .lean();

    const formatted = feedbacks.map((fb) => ({
      user: fb.user || null,
      caterer: fb.caterer || null,
      breakfast: fb.breakfast,
      lunch: fb.lunch,
      dinner: fb.dinner,
      comment: fb.comment,
      smcFields: fb.user?.isSMC ? fb.smcFields : undefined,
      date: fb.date,
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error("getAllFeedback error:", err);
    return res.status(500).json({
      message: "Error fetching feedbacks",
      error: String(err?.message || err),
    });
  }
};

// ==========================================
// Enable / Disable Feedback Window
// ==========================================
const enableFeedback = async (req, res) => {
  try {
    let s = await FeedbackSettings.findOne();
    if (!s) {
      s = new FeedbackSettings();
      s.currentWindowNumber = 1;
    }

    // If enabling a new window, increment window number and reset user submission flags
    if (!s.isEnabled) {
      s.currentWindowNumber += 1;
      // Reset all users' feedback submission flags for the new window
      await User.updateMany({}, { $set: { isFeedbackSubmitted: false } });
    }

    s.isEnabled = true;
    s.enabledAt = new Date();
    s.disabledAt = null;
    await s.save();
    return res.status(200).json({ message: "Feedback enabled", data: s });
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Failed to enable", error: String(e.message || e) });
  }
};

const disableFeedback = async (req, res) => {
  try {
    let s = await FeedbackSettings.findOne();
    if (!s) return res.status(404).json({ message: "Settings not found" });
    s.isEnabled = false;
    s.disabledAt = new Date();
    await s.save();
    return res.status(200).json({ message: "Feedback disabled", data: s });
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Failed to disable", error: String(e.message || e) });
  }
};

// ==========================================
// Get feedback settings
// ==========================================
const getFeedbackSettings = async (req, res) => {
  try {
    let s = await FeedbackSettings.findOne();
    if (s?.isEnabled && s.enabledAt) {
      const expiresAt = new Date(
        new Date(s.enabledAt).getTime() + 2 * 24 * 60 * 60 * 1000
      );
      if (new Date() > expiresAt) {
        s.isEnabled = false;
        s.disabledAt = new Date();
        await s.save();
      }
    }
    return res.status(200).json(
      s || {
        isEnabled: false,
        enabledAt: null,
        disabledAt: null,
        currentWindowNumber: 1,
      }
    );
  } catch (e) {
    return res.status(500).json({
      message: "Failed to fetch settings",
      error: String(e.message || e),
    });
  }
};

// ==========================================
// Get feedback settings (Public - for mobile app)
// ==========================================
const getFeedbackSettingsPublic = async (req, res) => {
  try {
    let s = await FeedbackSettings.findOne();
    if (s?.isEnabled && s.enabledAt) {
      const expiresAt = new Date(
        new Date(s.enabledAt).getTime() + 2 * 24 * 60 * 60 * 1000
      );
      if (new Date() > expiresAt) {
        s.isEnabled = false;
        s.disabledAt = new Date();
        await s.save();
      }
    }
    return res.status(200).json(
      s || {
        isEnabled: false,
        enabledAt: null,
        disabledAt: null,
        currentWindowNumber: 1,
      }
    );
  } catch (e) {
    return res.status(500).json({
      message: "Failed to fetch settings",
      error: String(e.message || e),
    });
  }
};

// ==========================================
// Leaderboard (All-time)
// ==========================================
const getFeedbackLeaderboard = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ caterer: { $ne: null } })
      .populate("user", "isSMC")
      .populate("caterer", "name")
      .lean();

    const toScore = (label) => ratingMap[label] ?? null;
    const groups = new Map();

    for (const fb of feedbacks) {
      const key = String(fb.caterer._id);
      if (!groups.has(key)) {
        groups.set(key, {
          catererId: key,
          catererName: fb.caterer.name,
          totalUsers: 0,
          smcUsers: 0,
          breakfastSum: 0,
          lunchSum: 0,
          dinnerSum: 0,
          smc: {
            hygieneSum: 0,
            wasteDisposalSum: 0,
            qualitySum: 0,
            uniformSum: 0,
            count: 0,
          },
        });
      }

      const g = groups.get(key);
      g.totalUsers += 1;
      if (fb.user?.isSMC) g.smcUsers += 1;

      g.breakfastSum += toScore(fb.breakfast) || 0;
      g.lunchSum += toScore(fb.lunch) || 0;
      g.dinnerSum += toScore(fb.dinner) || 0;

      if (fb.user?.isSMC && fb.smcFields) {
        g.smc.hygieneSum += toScore(fb.smcFields.hygiene) || 0;
        g.smc.wasteDisposalSum += toScore(fb.smcFields.wasteDisposal) || 0;
        g.smc.qualitySum += toScore(fb.smcFields.qualityOfIngredients) || 0;
        g.smc.uniformSum += toScore(fb.smcFields.uniformAndPunctuality) || 0;
        g.smc.count += 1;
      }
    }

    const rows = [];
    for (const [, g] of groups) {
      const nonSmcAvg =
        g.totalUsers > 0
          ? (g.breakfastSum + g.lunchSum + g.dinnerSum) / (3 * g.totalUsers)
          : 0;

      const smcAvg =
        g.smc.count > 0
          ? (g.smc.hygieneSum +
              g.smc.wasteDisposalSum +
              g.smc.qualitySum +
              g.smc.uniformSum) /
            (4 * g.smc.count)
          : 0;

      const overall = nonSmcAvg * 0.6 + smcAvg * 0.4;

      rows.push({
        catererId: g.catererId,
        catererName: g.catererName,
        totalUsers: g.totalUsers,
        smcUsers: g.smcUsers,
        avgBreakfast: g.totalUsers ? g.breakfastSum / g.totalUsers : 0,
        avgLunch: g.totalUsers ? g.lunchSum / g.totalUsers : 0,
        avgDinner: g.totalUsers ? g.dinnerSum / g.totalUsers : 0,
        avgHygiene: g.smc.count ? g.smc.hygieneSum / g.smc.count : null,
        avgWasteDisposal: g.smc.count
          ? g.smc.wasteDisposalSum / g.smc.count
          : null,
        avgQualityOfIngredients: g.smc.count
          ? g.smc.qualitySum / g.smc.count
          : null,
        avgUniformAndPunctuality: g.smc.count
          ? g.smc.uniformSum / g.smc.count
          : null,
        overall,
      });
    }

    rows.sort((a, b) => b.overall - a.overall);
    rows.forEach((r, i) => (r.rank = i + 1));

    return res.status(200).json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      message: "Failed to build leaderboard",
      error: String(e.message || e),
    });
  }
};

// ==========================================
// Available feedback windows
// ==========================================
const getAvailableWindows = async (req, res) => {
  try {
    const feedbacks = await Feedback.find(
      {},
      { feedbackWindowNumber: 1 }
    ).lean();

    const windowsSet = new Set();
    feedbacks.forEach((fb) => {
      if (fb.feedbackWindowNumber) {
        windowsSet.add(fb.feedbackWindowNumber);
      }
    });

    const windows = Array.from(windowsSet).sort((a, b) => b - a); // Sort descending (newest first)
    return res.status(200).json(windows);
  } catch (e) {
    console.error("getAvailableWindows error:", e);
    return res.status(500).json({ message: "Failed to fetch windows" });
  }
};

// ==========================================
// Window-based leaderboard
// ==========================================
const getFeedbackLeaderboardByWindow = async (req, res) => {
  try {
    const { windowNumber } = req.query;

    if (!windowNumber) {
      return res.status(400).json({ message: "Window number required" });
    }

    const feedbacks = await Feedback.find({
      caterer: { $ne: null },
      feedbackWindowNumber: parseInt(windowNumber),
    })
      .populate("user", "isSMC")
      .populate("caterer", "name")
      .lean();

    const toScore = (label) => ratingMap[label] ?? null;
    const groups = new Map();

    for (const fb of feedbacks) {
      const key = String(fb.caterer._id);
      if (!groups.has(key)) {
        groups.set(key, {
          catererId: key,
          catererName: fb.caterer.name,
          totalUsers: 0,
          smcUsers: 0,
          breakfastSum: 0,
          lunchSum: 0,
          dinnerSum: 0,
          smc: {
            hygieneSum: 0,
            wasteDisposalSum: 0,
            qualitySum: 0,
            uniformSum: 0,
            count: 0,
          },
        });
      }

      const g = groups.get(key);
      g.totalUsers += 1;
      if (fb.user?.isSMC) g.smcUsers += 1;

      g.breakfastSum += toScore(fb.breakfast) || 0;
      g.lunchSum += toScore(fb.lunch) || 0;
      g.dinnerSum += toScore(fb.dinner) || 0;

      if (fb.user?.isSMC && fb.smcFields) {
        g.smc.hygieneSum += toScore(fb.smcFields.hygiene) || 0;
        g.smc.wasteDisposalSum += toScore(fb.smcFields.wasteDisposal) || 0;
        g.smc.qualitySum += toScore(fb.smcFields.qualityOfIngredients) || 0;
        g.smc.uniformSum += toScore(fb.smcFields.uniformAndPunctuality) || 0;
        g.smc.count += 1;
      }
    }

    const rows = [];
    for (const [, g] of groups) {
      const nonSmcAvg =
        g.totalUsers > 0
          ? (g.breakfastSum + g.lunchSum + g.dinnerSum) / (3 * g.totalUsers)
          : 0;

      const smcAvg =
        g.smc.count > 0
          ? (g.smc.hygieneSum +
              g.smc.wasteDisposalSum +
              g.smc.qualitySum +
              g.smc.uniformSum) /
            (4 * g.smc.count)
          : 0;

      const overall = nonSmcAvg * 0.6 + smcAvg * 0.4;

      rows.push({
        catererId: g.catererId,
        catererName: g.catererName,
        totalUsers: g.totalUsers,
        smcUsers: g.smcUsers,
        avgBreakfast: g.totalUsers ? g.breakfastSum / g.totalUsers : 0,
        avgLunch: g.totalUsers ? g.lunchSum / g.totalUsers : 0,
        avgDinner: g.totalUsers ? g.dinnerSum / g.totalUsers : 0,
        avgHygiene: g.smc.count ? g.smc.hygieneSum / g.smc.count : null,
        avgWasteDisposal: g.smc.count
          ? g.smc.wasteDisposalSum / g.smc.count
          : null,
        avgQualityOfIngredients: g.smc.count
          ? g.smc.qualitySum / g.smc.count
          : null,
        avgUniformAndPunctuality: g.smc.count
          ? g.smc.uniformSum / g.smc.count
          : null,
        overall,
      });
    }

    rows.sort((a, b) => b.overall - a.overall);
    rows.forEach((r, i) => (r.rank = i + 1));

    return res.status(200).json(rows);
  } catch (e) {
    console.error("getFeedbackLeaderboardByWindow error:", e);
    return res.status(500).json({
      message: "Failed to fetch window-based leaderboard",
      error: String(e.message || e),
    });
  }
};

// ==========================================
// Check if feedback is already submitted for this window
// ==========================================
const checkFeedbackSubmitted = async (req, res) => {
  try {
    const user = req.user; // set by authenticateJWT
    if (!user)
      return res
        .status(401)
        .json({ submitted: false, message: "User not authenticated" });

    // Check if user has submitted feedback for current window
    if (user.isFeedbackSubmitted) {
      return res.status(200).json({ submitted: true });
    } else {
      return res.status(200).json({ submitted: false });
    }
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ submitted: false, message: "Error checking feedback status" });
  }
};

// ==========================================
// Get feedback window closing time and time left
// ==========================================
const getFeedbackWindowTimeLeft = async (req, res) => {
  try {
    let s = await FeedbackSettings.findOne();
    if (!s || !s.isEnabled || !s.currentWindowClosingTime) {
      return res.status(404).json({ message: "No active feedback window" });
    }
    const now = new Date();
    const closing = new Date(s.currentWindowClosingTime);
    let diffMs = closing - now;
    if (diffMs <= 0) {
      return res
        .status(200)
        .json({ timeLeft: 0, unit: "minutes", formatted: "Closed" });
    }
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / (60 * 60000));
    const days = Math.floor(diffMs / (24 * 60 * 60000));
    let formatted = "";
    let unit = "minutes";
    if (days >= 1) {
      formatted = `${days} day${days > 1 ? "s" : ""} ${hours % 24} hour${
        hours % 24 !== 1 ? "s" : ""
      }`;
      unit = "days";
    } else if (hours >= 1) {
      formatted = `${hours} hour${hours !== 1 ? "s" : ""} ${
        minutes % 60
      } minute${minutes % 60 !== 1 ? "s" : ""}`;
      unit = "hours";
    } else {
      formatted = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
      unit = "minutes";
    }
    return res.status(200).json({ timeLeft: diffMs, unit, formatted });
  } catch (e) {
    return res
      .status(500)
      .json({
        message: "Failed to fetch window time left",
        error: String(e.message || e),
      });
  }
};

module.exports = {
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
};
