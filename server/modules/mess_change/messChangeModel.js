const mongoose = require("mongoose");

const messChangeSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true,
  },
  fromHostel: {
    type: String,
    required: true,
  },
  toHostel1: {
    type: String,
    required: true,
  },
   toHostel2: {
    type: String,
    required: true,
  },
   toHostel3: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on save
messChangeSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const MessChange = mongoose.model("MessChange", messChangeSchema);

module.exports = { MessChange };
