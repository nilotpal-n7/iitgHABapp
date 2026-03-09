const mongoose = require("mongoose");

const dayEnum = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const roomCleaningSlotSchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
      index: true,
    },
    weekDay: {
      type: String,
      enum: dayEnum,
      required: true,
      lowercase: true,
      trim: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    maxSlots: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    maxBookingsPerUserPerWeek: {
      type: Number,
      required: true,
      min: 1,
      default: 2,
    },
    bookedSlots: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);

roomCleaningSlotSchema.index(
  { hostelId: 1, weekDay: 1, startTime: 1, endTime: 1 },
  { unique: true }
);

const roomCleaningBookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
      index: true,
    },
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomCleaningSlot",
      required: true,
      index: true,
    },
    requestedDate: {
      type: Date,
      required: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "pending"],
      default: "pending",
    },
  },
  { timestamps: true }
);

roomCleaningBookingSchema.index(
  { user: 1, slot: 1, requestedDate: 1 },
  { unique: true }
);

const roomCleaningScheduleSchema = new mongoose.Schema(
  {
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomCleaningSlot",
      required: true,
      index: true,
    },
    scheduleDate: {
      type: Date,
      required: true,
      index: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
      index: true,
    },
    pdfUrl: {
      type: String,
      trim: true,
      default: "",
    },
    finalSchedule: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        userName: { type: String, required: true },
        rollNumber: { type: String, default: "" },
        roomNumber: { type: String, default: "" },
        hostelId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Hostel",
          required: true,
        },
        hostelName: { type: String, default: "" },
      },
    ],
    scheduleGenerated: {
      type: Boolean,
      default: false,
    },
    scheduleGeneratedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);
roomCleaningScheduleSchema.index({ slot: 1, scheduleDate: 1 }, { unique: true });

const RoomCleaningSlot = mongoose.model(
  "RoomCleaningSlot",
  roomCleaningSlotSchema
);
const RoomCleaningBooking = mongoose.model(
  "RoomCleaningBooking",
  roomCleaningBookingSchema
);
const RoomCleaningSchedule = mongoose.model(
  "RoomCleaningSchedule",
  roomCleaningScheduleSchema
);

module.exports = {
  RoomCleaningSlot,
  RoomCleaningBooking,
  RoomCleaningSchedule,
};
