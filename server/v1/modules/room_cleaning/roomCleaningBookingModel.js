const mongoose = require("mongoose");

// Single collection for all room-cleaning bookings.
// Fields are derived from ROOM_CLEANING_FLOW.md.
//
// Migration note: If you see E11000 duplicate key on index
// "user_1_slot_1_requestedDate_1", that index is from an old schema (user,
// requestedDate). Drop it: run server/v1/scripts/dropRoomCleaningLegacyIndex.js
// once per environment (e.g. production/staging).

const roomCleaningBookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
      index: true,
    },
    // Calendar date for which cleaning is requested (start-of-day).
    bookingDate: {
      type: Date,
      required: true,
      index: true,
    },
    // Slot identifiers: A = 12–14, B = 14–16, C = 16–18, D = 18–20.
    slot: {
      type: String,
      enum: ["A", "B", "C", "D"],
      required: true,
      index: true,
    },
    // Optional numeric assignment to a specific room cleaner (1..N).
    assignedTo: {
      type: Number,
      min: 1,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["Booked", "Buffered", "Cancelled", "Cleaned", "CouldNotBeCleaned"],
      default: "Booked",
      index: true,
    },
    // Reason is only meaningful when status === "CouldNotBeCleaned".
    // Restrict to a fixed set of values to keep reporting consistent.
    reason: {
      type: String,
      enum: [
        "Student Did Not Respond",
        "Student Asked To Cancel",
        "Room Cleaners Not Available",
      ],
      default: null,
    },
    // Optional reference to rcFeedback document containing structured feedback
    // for this booking (only after Cleaned).
    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RcFeedback",
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

// Prevent duplicate booking for same user + date + slot (per hostel).
roomCleaningBookingSchema.index(
  { userId: 1, hostelId: 1, bookingDate: 1, slot: 1 },
  { unique: true },
);

const RoomCleaningBooking = mongoose.model(
  "RoomCleaningBooking",
  roomCleaningBookingSchema,
);

module.exports = { RoomCleaningBooking };

