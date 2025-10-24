const { User } = require("../user/userModel");
const { Hostel } = require("../hostel/hostelModel");
const Feedback = require("./feedbackModel");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");
const { FeedbackSettings } = require("./feedbackSettingsModel");

const ratingMap = {
  "Very Poor": 1,
  Poor: 2,
  Average: 3,
  Good: 4,
  "Very Good": 5,
};

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

    // 1. Find user by name and rollNumber
    const user = await User.findOne({ name, rollNumber });
    if (!user) return res.status(404).send("User not found");

    // Check if feedback for this user and month already exists
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const existingFeedback = await Feedback.findOne({
      user: user._id,
      timestamp: { $gte: monthStart, $lt: monthEnd },
    });
    if (existingFeedback) {
      return res.status(400).send("Feedback already submitted for this month");
    }

    // 5. Prepare to upload data in form of schema
    const feedbackData = {
      user: user._id,
      breakfast,
      lunch,
      dinner,
      comment,
      timestamp: new Date(),
    };

    // Resolve caterer (mess) id from user's current subscribed mess (hostel)
    // We have user.curr_subscribed_mess referencing Hostel. Need Hostel.messId
    let catererId = null;
    if (user.curr_subscribed_mess) {
      const hostelDoc = await Hostel.findById(user.curr_subscribed_mess).lean();
      catererId = hostelDoc?.messId || null;
    }
    feedbackData.caterer = catererId;

    // 6. Include SMC fields only if user.isSMC === true
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

    // 7. Mark feedback as submitted
    user.feedbackSubmitted = true;
    await user.save();

    res.status(200).send("Feedback submitted successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving feedback");
  }
};

const removeFeedback = async (req, res) => {
  try {
    const { name, rollNumber } = req.body;
    if (!name || !rollNumber) {
      return res.status(400).send("Name and Roll Number required");
    }

    // 1. Find the user
    const user = await User.findOne({ name, rollNumber });
    if (!user) {
      return res.status(404).send("User not found");
    }

    if (!user.feedbackSubmitted) {
      return res.status(400).send("No feedback submitted by this user");
    }

    // // 2. Update user document
    // user.feedbackSubmitted = false;
    // await user.save();

    // 1. Delete feedback from MongoDB
    await Feedback.deleteOne({ user: user._id });

    // 2. Update user document
    user.feedbackSubmitted = false;
    await user.save();

    res.status(200).send("Feedback removed successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error removing feedback");
  }
};

// Fetch all feedbacks (or you can filter by user/hostel if needed)
const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("user", "name rollNumber isSMC") // user may be null if deleted
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

// Enable/Disable feedback window
const enableFeedback = async (req, res) => {
  try {
    let s = await FeedbackSettings.findOne();
    if (!s) s = new FeedbackSettings();
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

const getFeedbackSettings = async (req, res) => {
  try {
    let s = await FeedbackSettings.findOne();
    // Auto-close if expired
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
    return res
      .status(200)
      .json(s || { isEnabled: false, enabledAt: null, disabledAt: null });
  } catch (e) {
    return res.status(500).json({
      message: "Failed to fetch settings",
      error: String(e.message || e),
    });
  }
};

// Leaderboard aggregation
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
          // sums
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

      // non-SMC fields always present
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
// NEW: Get available feedback months
// ==========================================
const getAvailableMonths = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({}, { date: 1 }).lean();

    const monthsSet = new Set();
    feedbacks.forEach((fb) => {
      if (fb.date) {
        const d = new Date(fb.date);
        const monthStr = `${d.getFullYear()}-${String(
          d.getMonth() + 1
        ).padStart(2, "0")}`;
        monthsSet.add(monthStr);
      }
    });

    const months = Array.from(monthsSet).sort();
    return res.status(200).json(months);
  } catch (e) {
    console.error("getAvailableMonths error:", e);
    return res.status(500).json({ message: "Failed to fetch months" });
  }
};

// ==========================================
// NEW: Month-based leaderboard
// ==========================================
const getFeedbackLeaderboardByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year required" });
    }

    const monthNum = parseInt(month) - 1; // 0-based index
    const startDate = new Date(year, monthNum, 1);
    const endDate = new Date(year, monthNum + 1, 1);

    const feedbacks = await Feedback.find({
      caterer: { $ne: null },
      date: { $gte: startDate, $lt: endDate },
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
    console.error("getFeedbackLeaderboardByMonth error:", e);
    return res.status(500).json({
      message: "Failed to fetch month-based leaderboard",
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
  getFeedbackLeaderboard,
  getFeedbackLeaderboardByMonth,
  getAvailableMonths,
};
