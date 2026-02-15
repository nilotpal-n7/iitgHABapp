const mongoose = require("mongoose");

//Define Leave Application Model
const leaveSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    leaveType: {
        type: String,
        enum: ["Academic", "Medical"],
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    numberOfDays: {
        type: Number,
        required: true,
    },
    eligibleDays: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
        required: true,
    },
    proofDocumentUrl: {
        type: String,
        required: true,
    },
    proofDocumentFilename: {
        type: String,
        required: true,
    },
    appliedAt: {
        type: Date,
        required: true,
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
    reviewedAt: {
        type: Date,
        required: false,
    },
    feedback: {
        type: String,
        required: false,
    },
    messHostel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hostel",
        required: true,
    },
    isEligibleForRebate: {
        type: Boolean,
        default: false,
        required: true
    },
});


const Leave = mongoose.model("Leave", leaveSchema);

//Export leave application model
module.exports = Leave;