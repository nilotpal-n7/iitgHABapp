const {
  RoomCleaningSlot,
  RoomCleaningBooking,
  RoomCleaningSchedule,
} = require("./roomCleaningModel");
const {
  buildFinalScheduleForSlotDate,
  generateFinalSchedulesForDueRequestedDates,
} = require("./roomCleaningScheduleService");

const dayMap = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const startOfDay = (dateInput) => {
  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
};

const getWeekRange = (dateInput) => {
  const date = startOfDay(dateInput);
  const day = date.getDay(); // 0 sunday ... 6 saturday
  const daysFromMonday = (day + 6) % 7;
  const weekStart = new Date(date);
  weekStart.setDate(weekStart.getDate() - daysFromMonday);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return { weekStart, weekEnd };
};

/**
 * Get available slots for the next 2 days (tomorrow and day after tomorrow)
 * Booking closes at midnight for the next day
 */
const getAvailableSlots = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!req.user.hostel) {
      return res.status(400).json({ 
        message: "User does not have an assigned hostel" 
      });
    }

    // Generate schedules for past dates
    await generateFinalSchedulesForDueRequestedDates();

    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const tomorrowDayName = dayMap[tomorrow.getDay()];
    const dayAfterTomorrowDayName = dayMap[dayAfterTomorrow.getDay()];

    // Get slots for tomorrow and day after tomorrow
    const slots = await RoomCleaningSlot.find({
      hostelId: req.user.hostel,
      weekDay: { $in: [tomorrowDayName, dayAfterTomorrowDayName] },
    })
      .sort({ startTime: 1 })
      .lean();

    // Get booking counts for these dates
    const tomorrowSlots = slots.filter((s) => s.weekDay === tomorrowDayName);
    const dayAfterTomorrowSlots = slots.filter((s) => s.weekDay === dayAfterTomorrowDayName);

    const formatSlotWithAvailability = async (slot, dateStr) => {
      const bookingCount = await RoomCleaningBooking.countDocuments({
        slot: slot._id,
        requestedDate: dateStr,
        status: { $in: ["pending", "confirmed"] },
      });

      const availableSlots = Math.max(slot.maxSlots - bookingCount, 0);
      
      return {
        id: slot._id,
        date: dateStr,
        weekDay: slot.weekDay,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxSlots: slot.maxSlots,
        bookedSlots: bookingCount,
        availableSlots,
        status: availableSlots > 0 ? "available" : "finished",
      };
    };

    const tomorrowSlotsFormatted = await Promise.all(
      tomorrowSlots.map((slot) => formatSlotWithAvailability(slot, tomorrow))
    );

    const dayAfterTomorrowSlotsFormatted = await Promise.all(
      dayAfterTomorrowSlots.map((slot) => formatSlotWithAvailability(slot, dayAfterTomorrow))
    );

    return res.status(200).json({
      tomorrow: {
        date: tomorrow,
        weekDay: tomorrowDayName,
        slots: tomorrowSlotsFormatted,
      },
      dayAfterTomorrow: {
        date: dayAfterTomorrow,
        weekDay: dayAfterTomorrowDayName,
        slots: dayAfterTomorrowSlotsFormatted,
      },
    });
  } catch (error) {
    console.error("getAvailableSlots error:", error);
    return res.status(500).json({
      message: "Failed to fetch available slots",
      error: String(error.message || error),
    });
  }
};

/**
 * User: Request a room cleaning booking
 * Can only book for tomorrow or day after tomorrow
 * Booking closes at midnight for the next day
 */
const requestRoomCleaningBooking = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    await generateFinalSchedulesForDueRequestedDates();

    const { slotId, requestedDate, notes } = req.body || {};
    if (!slotId || !requestedDate) {
      return res
        .status(400)
        .json({ message: "slotId and requestedDate are required", status: "pending" });
    }

    const parsedRequestedDate = new Date(requestedDate);
    if (Number.isNaN(parsedRequestedDate.getTime())) {
      return res
        .status(400)
        .json({ message: "requestedDate is invalid", status: "pending" });
    }
    const requestedDayStart = startOfDay(parsedRequestedDate);

    // Check if booking is for tomorrow or day after tomorrow
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const isValidDate = 
      requestedDayStart.getTime() === tomorrow.getTime() ||
      requestedDayStart.getTime() === dayAfterTomorrow.getTime();

    if (!isValidDate) {
      return res.status(400).json({
        message: "You can only book for tomorrow or the day after tomorrow",
        status: "pending",
      });
    }

    const slot = await RoomCleaningSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: "Slot not found", status: "pending" });
    }

    const requestedWeekDay = dayMap[requestedDayStart.getDay()];
    if (requestedWeekDay !== slot.weekDay) {
      return res.status(400).json({
        message: "requestedDate does not match slot weekDay",
        status: "pending",
      });
    }

    // Check if booking closes at midnight (booking closes for tomorrow at midnight)
    // This means: if today >= requested date, booking is closed
    if (new Date() >= requestedDayStart) {
      await buildFinalScheduleForSlotDate({
        slotDoc: slot,
        requestedDate: requestedDayStart,
      });
      return res.status(400).json({
        message:
          "Booking window is closed for this date. Schedule has been finalized.",
        status: "pending",
      });
    }

    if (req.user.hostel && String(req.user.hostel) !== String(slot.hostelId)) {
      return res.status(403).json({
        message: "You can only book room cleaning slots for your hostel",
        status: "pending",
      });
    }

    const existingBooking = await RoomCleaningBooking.findOne({
      user: req.user._id,
      slot: slot._id,
      requestedDate: requestedDayStart,
      status: { $in: ["pending", "confirmed"] },
    });
    if (existingBooking) {
      return res.status(200).json({
        message: "Room cleaning booking already exists for this slot",
        status: existingBooking.status,
        booking: existingBooking,
      });
    }

    const activeBookingsCount = await RoomCleaningBooking.countDocuments({
      slot: slot._id,
      requestedDate: requestedDayStart,
      status: { $in: ["pending", "confirmed"] },
    });
    if (activeBookingsCount >= slot.maxSlots) {
      return res.status(400).json({
        message: "No slots available for room cleaning on this date",
        status: "pending",
      });
    }

    const { weekStart, weekEnd } = getWeekRange(requestedDayStart);
    const userBookingsThisWeek = await RoomCleaningBooking.countDocuments({
      user: req.user._id,
      hostelId: slot.hostelId,
      requestedDate: { $gte: weekStart, $lt: weekEnd },
      status: { $in: ["pending", "confirmed"] },
    });
    if (userBookingsThisWeek >= slot.maxBookingsPerUserPerWeek) {
      return res.status(400).json({
        message: "Weekly booking limit reached for room cleaning",
        status: "pending",
      });
    }

    try {
      const booking = await RoomCleaningBooking.create({
        user: req.user._id,
        hostelId: slot.hostelId,
        slot: slot._id,
        requestedDate: requestedDayStart,
        notes: notes || "",
        status: "confirmed",
      });

      const updatedCount = await RoomCleaningBooking.countDocuments({
        slot: slot._id,
        requestedDate: requestedDayStart,
        status: { $in: ["pending", "confirmed"] },
      });
      await RoomCleaningSlot.updateOne(
        { _id: slot._id },
        { $set: { bookedSlots: updatedCount } }
      );

      return res.status(201).json({
        message: "Room cleaning slot booked successfully",
        status: "confirmed",
        booking,
        availability: {
          requestedDate: requestedDayStart,
          maxSlots: slot.maxSlots,
          bookedSlots: updatedCount,
          availableSlots: Math.max(slot.maxSlots - updatedCount, 0),
        },
      });
    } catch (bookingError) {
      if (bookingError?.code === 11000) {
        return res.status(200).json({
          message: "Room cleaning booking already exists for this slot",
          status: "pending",
        });
      }
      throw bookingError;
    }
  } catch (error) {
    console.error("requestRoomCleaningBooking error:", error);
    return res.status(500).json({
      message: "Failed to book room cleaning slot",
      status: "pending",
      error: String(error.message || error),
    });
  }
};

const cancelRoomCleaningBooking = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { bookingId } = req.body || {};
    if (!bookingId) {
      return res
        .status(400)
        .json({ message: "bookingId is required", status: "pending" });
    }

    const booking = await RoomCleaningBooking.findOne({
      _id: bookingId,
      user: req.user._id,
      status: { $in: ["pending", "confirmed"] },
    });
    if (!booking) {
      return res.status(404).json({
        message: "Active booking not found",
        status: "pending",
      });
    }

    const requestedDayStart = startOfDay(booking.requestedDate);
    if (new Date() >= requestedDayStart) {
      return res.status(400).json({
        message: "Cancellation window is closed for this booking",
        status: "pending",
      });
    }

    const existingSchedule = await RoomCleaningSchedule.findOne({
      slot: booking.slot,
      scheduleDate: requestedDayStart,
      scheduleGenerated: true,
    }).lean();
    if (existingSchedule) {
      return res.status(400).json({
        message: "Cannot cancel booking after schedule has been generated",
        status: "pending",
      });
    }

    booking.status = "cancelled";
    await booking.save();

    const updatedCount = await RoomCleaningBooking.countDocuments({
      slot: booking.slot,
      requestedDate: requestedDayStart,
      status: { $in: ["pending", "confirmed"] },
    });
    await RoomCleaningSlot.updateOne(
      { _id: booking.slot },
      { $set: { bookedSlots: updatedCount } }
    );

    return res.status(200).json({
      message: "Room cleaning booking cancelled successfully",
      status: "cancelled",
      booking,
      availability: {
        requestedDate: requestedDayStart,
        bookedSlots: updatedCount,
      },
    });
  } catch (error) {
    console.error("cancelRoomCleaningBooking error:", error);
    return res.status(500).json({
      message: "Failed to cancel room cleaning booking",
      status: "pending",
      error: String(error.message || error),
    });
  }
};

const getMyRoomCleaningBookings = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    await generateFinalSchedulesForDueRequestedDates();

    const bookings = await RoomCleaningBooking.find({ user: req.user._id })
      .populate("slot")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ bookings });
  } catch (error) {
    console.error("getMyRoomCleaningBookings error:", error);
    return res.status(500).json({
      message: "Failed to fetch room cleaning bookings",
      error: String(error.message || error),
    });
  }
};

module.exports = {
  getAvailableSlots,
  requestRoomCleaningBooking,
  getMyRoomCleaningBookings,
  cancelRoomCleaningBooking,
};
