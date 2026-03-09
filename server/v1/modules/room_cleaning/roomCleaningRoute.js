const express = require("express");
const {
  getAvailableSlots,
  requestRoomCleaningBooking,
  getMyRoomCleaningBookings,
  cancelRoomCleaningBooking,
} = require("./roomCleaningBookingController");
const {
  createOrUpdateSlot,
  getMyHostelSlots,
  deleteSlot,
  getTodaySchedule,
} = require("./roomCleaningSMCController");
const {
  authenticateJWT,
} = require("../../middleware/authenticateJWT");

const roomCleaningRouter = express.Router();

// ============ User Routes ============
// Get available slots for next 2 days (tomorrow and day after tomorrow)
roomCleaningRouter.get("/slots/available", authenticateJWT, getAvailableSlots);

// Book a room cleaning slot
roomCleaningRouter.post("/booking/request", authenticateJWT, requestRoomCleaningBooking);

// Cancel a booking
roomCleaningRouter.post("/booking/cancel", authenticateJWT, cancelRoomCleaningBooking);

// Get my bookings
roomCleaningRouter.get("/booking/my", authenticateJWT, getMyRoomCleaningBookings);

// ============ SMC Routes ============
// Get all weekly recurring slots for the SMC's hostel
roomCleaningRouter.get("/smc/slots", authenticateJWT, getMyHostelSlots);

// Create or update a weekly recurring slot
roomCleaningRouter.post("/smc/slots", authenticateJWT, createOrUpdateSlot);

// Delete a slot
roomCleaningRouter.delete("/smc/slots/:slotId", authenticateJWT, deleteSlot);

// Get today's cleaning schedule (includes PDF link if available)
roomCleaningRouter.get("/smc/schedule/today", authenticateJWT, getTodaySchedule);

module.exports = roomCleaningRouter;
