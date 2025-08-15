const mongoose = require("mongoose");

const messChangeSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  fromHostel: {
    type: String,
    required: true,
  },
  toHostel: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  month: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MessChange = mongoose.model("MessChange", messChangeSchema);

module.exports = { MessChange };
