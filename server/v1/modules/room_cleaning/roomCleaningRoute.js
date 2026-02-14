const express = require("express");
const {
  setRoomCleaningSlot,
  getRoomCleaningSlots,
} = require("./roomCleaningSlotController");
const {
  requestRoomCleaningBooking,
  getMyRoomCleaningBookings,
  cancelRoomCleaningBooking,
} = require("./roomCleaningBookingController");
const {
  authenticateJWT,
  authenticateAdminJWT,
} = require("../../middleware/authenticateJWT");

const roomCleaningRouter = express.Router();

// User routes
roomCleaningRouter.post("/booking/request", authenticateJWT, requestRoomCleaningBooking);
roomCleaningRouter.post("/booking/cancel", authenticateJWT, cancelRoomCleaningBooking);
roomCleaningRouter.get("/booking/my", authenticateJWT, getMyRoomCleaningBookings);
roomCleaningRouter.get("/slots", getRoomCleaningSlots);

// Admin routes
roomCleaningRouter.post("/admin/slots", authenticateAdminJWT, setRoomCleaningSlot);

module.exports = roomCleaningRouter;
