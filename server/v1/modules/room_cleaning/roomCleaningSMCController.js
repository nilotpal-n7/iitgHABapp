const { RoomCleaningSlot, RoomCleaningSchedule } = require("./roomCleaningModel");
const { buildFinalScheduleForSlotDate } = require("./roomCleaningScheduleService");

const dayEnum = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const normalizeWeekDay = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

const startOfDay = (dateInput) => {
  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
};

/**
 * SMC: Create or update a weekly recurring slot for room cleaning
 * Body: { weekDay, startTime, endTime, maxSlots, slotId (optional for update) }
 */
const createOrUpdateSlot = async (req, res) => {
  try {
    const user = req.user;
    
    // Verify user is SMC member
    if (!user?.isSMC) {
      return res.status(403).json({ 
        message: "Unauthorized: Only SMC members can manage room cleaning slots" 
      });
    }

    if (!user.hostel) {
      return res.status(400).json({ 
        message: "User does not have an assigned hostel" 
      });
    }

    const { slotId, weekDay, startTime, endTime, maxSlots } = req.body || {};

    // Validate inputs
    const normalizedDay = normalizeWeekDay(weekDay);
    if (!dayEnum.includes(normalizedDay)) {
      return res.status(400).json({ 
        message: "Invalid weekDay. Must be one of: " + dayEnum.join(", ") 
      });
    }

    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);
    
    if (Number.isNaN(parsedStartTime.getTime()) || Number.isNaN(parsedEndTime.getTime())) {
      return res.status(400).json({ message: "Invalid startTime or endTime" });
    }

    if (parsedEndTime <= parsedStartTime) {
      return res.status(400).json({ message: "endTime must be after startTime" });
    }

    const parsedMaxSlots = Number(maxSlots);
    if (!Number.isInteger(parsedMaxSlots) || parsedMaxSlots < 0) {
      return res.status(400).json({ 
        message: "maxSlots must be a non-negative integer" 
      });
    }

    let slotDoc;

    if (slotId) {
      // Update existing slot
      const existingSlot = await RoomCleaningSlot.findOne({
        _id: slotId,
        hostelId: user.hostel,
      });

      if (!existingSlot) {
        return res.status(404).json({ 
          message: "Slot not found or does not belong to your hostel" 
        });
      }

      // Cannot reduce maxSlots below already booked slots
      if (parsedMaxSlots < existingSlot.bookedSlots) {
        return res.status(400).json({
          message: `Cannot reduce maxSlots to ${parsedMaxSlots}. Already ${existingSlot.bookedSlots} slots are booked.`,
        });
      }

      slotDoc = await RoomCleaningSlot.findOneAndUpdate(
        { _id: slotId, hostelId: user.hostel },
        {
          $set: {
            weekDay: normalizedDay,
            startTime: parsedStartTime,
            endTime: parsedEndTime,
            maxSlots: parsedMaxSlots,
          },
        },
        { new: true, runValidators: true }
      );
    } else {
      // Create new slot or update if same time window exists
      const existingByWindow = await RoomCleaningSlot.findOne({
        hostelId: user.hostel,
        weekDay: normalizedDay,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
      });

      if (existingByWindow && parsedMaxSlots < existingByWindow.bookedSlots) {
        return res.status(400).json({
          message: `Cannot set maxSlots to ${parsedMaxSlots}. Already ${existingByWindow.bookedSlots} slots are booked.`,
        });
      }

      slotDoc = await RoomCleaningSlot.findOneAndUpdate(
        {
          hostelId: user.hostel,
          weekDay: normalizedDay,
          startTime: parsedStartTime,
          endTime: parsedEndTime,
        },
        {
          $set: {
            maxSlots: parsedMaxSlots,
          },
          $setOnInsert: {
            hostelId: user.hostel,
            weekDay: normalizedDay,
            startTime: parsedStartTime,
            endTime: parsedEndTime,
            bookedSlots: 0,
            maxBookingsPerUserPerWeek: 2, // Default value
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );
    }

    return res.status(200).json({
      message: "Slot saved successfully",
      slot: {
        id: slotDoc._id,
        weekDay: slotDoc.weekDay,
        startTime: slotDoc.startTime,
        endTime: slotDoc.endTime,
        maxSlots: slotDoc.maxSlots,
        bookedSlots: slotDoc.bookedSlots,
        availableSlots: Math.max(slotDoc.maxSlots - slotDoc.bookedSlots, 0),
      },
    });
  } catch (error) {
    console.error("createOrUpdateSlot error:", error);
    return res.status(500).json({
      message: "Failed to save slot",
      error: String(error.message || error),
    });
  }
};

/**
 * SMC: Get all weekly recurring slots for their hostel
 */
const getMyHostelSlots = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user?.isSMC) {
      return res.status(403).json({ 
        message: "Unauthorized: Only SMC members can access this" 
      });
    }

    if (!user.hostel) {
      return res.status(400).json({ 
        message: "User does not have an assigned hostel" 
      });
    }

    const slots = await RoomCleaningSlot.find({ hostelId: user.hostel })
      .sort({ weekDay: 1, startTime: 1 })
      .lean();

    // Group slots by weekday
    const slotsByDay = dayEnum.reduce((acc, day) => {
      acc[day] = slots
        .filter((slot) => slot.weekDay === day)
        .map((slot) => ({
          id: slot._id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          maxSlots: slot.maxSlots,
          bookedSlots: slot.bookedSlots,
          availableSlots: Math.max(slot.maxSlots - slot.bookedSlots, 0),
        }));
      return acc;
    }, {});

    return res.status(200).json({ slotsByDay });
  } catch (error) {
    console.error("getMyHostelSlots error:", error);
    return res.status(500).json({
      message: "Failed to fetch slots",
      error: String(error.message || error),
    });
  }
};

/**
 * SMC: Delete a slot (only if no bookings exist)
 */
const deleteSlot = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user?.isSMC) {
      return res.status(403).json({ 
        message: "Unauthorized: Only SMC members can delete slots" 
      });
    }

    if (!user.hostel) {
      return res.status(400).json({ 
        message: "User does not have an assigned hostel" 
      });
    }

    const { slotId } = req.params;
    if (!slotId) {
      return res.status(400).json({ message: "slotId is required" });
    }

    const slot = await RoomCleaningSlot.findOne({
      _id: slotId,
      hostelId: user.hostel,
    });

    if (!slot) {
      return res.status(404).json({ 
        message: "Slot not found or does not belong to your hostel" 
      });
    }

    if (slot.bookedSlots > 0) {
      return res.status(400).json({
        message: "Cannot delete slot with existing bookings",
      });
    }

    await RoomCleaningSlot.deleteOne({ _id: slotId });

    return res.status(200).json({
      message: "Slot deleted successfully",
    });
  } catch (error) {
    console.error("deleteSlot error:", error);
    return res.status(500).json({
      message: "Failed to delete slot",
      error: String(error.message || error),
    });
  }
};

/**
 * SMC: Get today's cleaning schedule
 */
const getTodaySchedule = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user?.isSMC) {
      return res.status(403).json({ 
        message: "Unauthorized: Only SMC members can access schedules" 
      });
    }

    if (!user.hostel) {
      return res.status(400).json({ 
        message: "User does not have an assigned hostel" 
      });
    }

    const today = startOfDay(new Date());
    const todayDayName = dayEnum[today.getDay()];

    // Get all slots for today's weekday
    const todaySlots = await RoomCleaningSlot.find({
      hostelId: user.hostel,
      weekDay: todayDayName,
    })
      .sort({ startTime: 1 })
      .lean();

    // For each slot, generate schedule if not already done
    const schedulePromises = todaySlots.map((slot) =>
      buildFinalScheduleForSlotDate({ slotDoc: slot, requestedDate: today })
    );
    await Promise.all(schedulePromises);

    // Fetch all schedules for today
    const schedules = await RoomCleaningSchedule.find({
      hostelId: user.hostel,
      scheduleDate: today,
    })
      .populate("slot", "startTime endTime maxSlots weekDay")
      .lean();

    const formattedSchedules = schedules.map((schedule) => ({
      slotId: schedule.slot._id,
      startTime: schedule.slot.startTime,
      endTime: schedule.slot.endTime,
      maxSlots: schedule.slot.maxSlots,
      bookings: schedule.finalSchedule,
      pdfUrl: schedule.pdfUrl || "",
      scheduleGenerated: schedule.scheduleGenerated,
    }));

    return res.status(200).json({
      date: today,
      weekDay: todayDayName,
      schedules: formattedSchedules,
    });
  } catch (error) {
    console.error("getTodaySchedule error:", error);
    return res.status(500).json({
      message: "Failed to fetch today's schedule",
      error: String(error.message || error),
    });
  }
};

module.exports = {
  createOrUpdateSlot,
  getMyHostelSlots,
  deleteSlot,
  getTodaySchedule,
};
