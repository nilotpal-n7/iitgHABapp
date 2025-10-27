const mongoose = require("mongoose");

const feedbackSettingsSchema = new mongoose.Schema({
  isEnabled: { type: Boolean, default: false },
  enabledAt: { type: Date, default: null },
  disabledAt: { type: Date, default: null },
  currentWindowNumber: { type: Number, default: 1 },
  isAutoScheduled: { type: Boolean, default: true },
});

const FeedbackSettings = mongoose.model(
  "FeedbackSettings",
  feedbackSettingsSchema
);

module.exports = { FeedbackSettings };
