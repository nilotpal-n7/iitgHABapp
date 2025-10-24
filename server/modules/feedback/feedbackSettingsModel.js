const mongoose = require("mongoose");

const feedbackSettingsSchema = new mongoose.Schema({
  isEnabled: { type: Boolean, default: false },
  enabledAt: { type: Date, default: null },
  disabledAt: { type: Date, default: null },
});

const FeedbackSettings = mongoose.model(
  "FeedbackSettings",
  feedbackSettingsSchema
);

module.exports = { FeedbackSettings };
