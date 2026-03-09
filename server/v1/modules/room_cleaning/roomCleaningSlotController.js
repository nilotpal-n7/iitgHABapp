const { RoomCleaningSlot } = require("./roomCleaningModel");
const {
  generateFinalSchedulesForDueRequestedDates,
  upsertRoomCleaningSchedulePdf,
} = require("./roomCleaningScheduleService");

const normalizeWeekDay = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

const setRoomCleaningSlot = async (req, res) => {
  try {
    if (!req.hostel?._id) {
      return res.status(401).json({ message: "Admin not authenticated" });
    }

    const {
      slotId,
      weekDay,
      startTime,
      endTime,
      maxSlots,
      maxBookingsPerUserPerWeek,
      pdfUrl,
      requestedDate,
    } = req.body || {};
    const hasSlotsInput = maxSlots !== undefined;
    const parsedSlots = hasSlotsInput ? Number(maxSlots) : null;
    const hasMaxPerUserInput = maxBookingsPerUserPerWeek !== undefined;
    const parsedMaxPerUser = hasMaxPerUserInput
      ? Number(maxBookingsPerUserPerWeek)
      : null;
    const hasWeekDayInput = weekDay !== undefined;
    const normalizedDay = hasWeekDayInput ? normalizeWeekDay(weekDay) : undefined;
    const hasStartInput = startTime !== undefined;
    const hasEndInput = endTime !== undefined;
    const parsedStartTime = hasStartInput ? new Date(startTime) : undefined;
    const parsedEndTime = hasEndInput ? new Date(endTime) : undefined;
    const isValidStart = hasStartInput ? !Number.isNaN(parsedStartTime.getTime()) : true;
    const isValidEnd = hasEndInput ? !Number.isNaN(parsedEndTime.getTime()) : true;

    let slotDoc;
    if (slotId) {
      const existingSlot = await RoomCleaningSlot.findOne({
        _id: slotId,
        hostelId: req.hostel._id,
      });
      if (!existingSlot) {
        return res.status(404).json({ message: "Slot not found" });
      }

      const nextMaxSlots = hasSlotsInput ? parsedSlots : existingSlot.maxSlots;
      if (!Number.isInteger(nextMaxSlots) || nextMaxSlots < existingSlot.bookedSlots) {
        return res.status(400).json({
          message:
            "maxSlots cannot be less than already booked slots for this slot",
        });
      }
      if (hasWeekDayInput && !normalizedDay) {
        return res.status(400).json({ message: "Invalid weekDay" });
      }
      if (!isValidStart || !isValidEnd) {
        return res.status(400).json({ message: "Invalid startTime or endTime" });
      }
      if (
        hasMaxPerUserInput &&
        (!Number.isInteger(parsedMaxPerUser) || parsedMaxPerUser < 1)
      ) {
        return res.status(400).json({
          message: "maxBookingsPerUserPerWeek must be an integer >= 1",
        });
      }

      slotDoc = await RoomCleaningSlot.findOneAndUpdate(
        { _id: slotId, hostelId: req.hostel._id },
        {
          $set: {
            ...(hasWeekDayInput ? { weekDay: normalizedDay } : {}),
            ...(hasStartInput ? { startTime: parsedStartTime } : {}),
            ...(hasEndInput ? { endTime: parsedEndTime } : {}),
            ...(hasSlotsInput ? { maxSlots: parsedSlots } : {}),
            ...(hasMaxPerUserInput
              ? { maxBookingsPerUserPerWeek: parsedMaxPerUser }
              : {}),
          },
        },
        { new: true, runValidators: true }
      );

      if (pdfUrl !== undefined) {
        if (!requestedDate) {
          return res
            .status(400)
            .json({ message: "requestedDate is required when setting pdfUrl" });
        }
        await upsertRoomCleaningSchedulePdf({
          slotId: slotDoc._id,
          hostelId: slotDoc.hostelId,
          requestedDate,
          pdfUrl,
        });
      }
    } else {
      if (
        !normalizedDay ||
        !isValidStart ||
        !isValidEnd ||
        !Number.isInteger(parsedSlots) ||
        parsedSlots < 0 ||
        !Number.isInteger(parsedMaxPerUser) ||
        parsedMaxPerUser < 1
      ) {
        return res.status(400).json({
          message:
            "weekDay, startTime, endTime, maxSlots and maxBookingsPerUserPerWeek are required",
        });
      }

      const existingByWindow = await RoomCleaningSlot.findOne({
        hostelId: req.hostel._id,
        weekDay: normalizedDay,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
      });

      if (existingByWindow && parsedSlots < existingByWindow.bookedSlots) {
        return res.status(400).json({
          message:
            "maxSlots cannot be less than already booked slots for this slot",
        });
      }

      slotDoc = await RoomCleaningSlot.findOneAndUpdate(
        {
          hostelId: req.hostel._id,
          weekDay: normalizedDay,
          startTime: parsedStartTime,
          endTime: parsedEndTime,
        },
        {
          $set: {
            maxSlots: parsedSlots,
            maxBookingsPerUserPerWeek: parsedMaxPerUser,
          },
          $setOnInsert: {
            bookedSlots: 0,
            hostelId: req.hostel._id,
            weekDay: normalizedDay,
            startTime: parsedStartTime,
            endTime: parsedEndTime,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );

      if (pdfUrl !== undefined) {
        if (!requestedDate) {
          return res
            .status(400)
            .json({ message: "requestedDate is required when setting pdfUrl" });
        }
        await upsertRoomCleaningSchedulePdf({
          slotId: slotDoc._id,
          hostelId: slotDoc.hostelId,
          requestedDate,
          pdfUrl,
        });
      }
    }

    return res.status(200).json({
      message: "Room cleaning slot saved successfully",
      data: {
        id: slotDoc._id,
        hostelId: slotDoc.hostelId,
        weekDay: slotDoc.weekDay,
        startTime: slotDoc.startTime,
        endTime: slotDoc.endTime,
        maxSlots: slotDoc.maxSlots,
        maxBookingsPerUserPerWeek: slotDoc.maxBookingsPerUserPerWeek,
        bookedSlots: slotDoc.bookedSlots,
        availableSlots: Math.max(slotDoc.maxSlots - slotDoc.bookedSlots, 0),
      },
    });
  } catch (error) {
    console.error("setRoomCleaningSlot error:", error);
    return res.status(500).json({
      message: "Failed to save room cleaning slot",
      error: String(error.message || error),
    });
  }
};

const getRoomCleaningSlots = async (req, res) => {
  try {
    const query = {};
    if (req.query.hostelId) query.hostelId = req.query.hostelId;
    if (req.query.weekDay) query.weekDay = normalizeWeekDay(req.query.weekDay);
    await generateFinalSchedulesForDueRequestedDates(query);

    const slots = await RoomCleaningSlot.find(query).sort({
      weekDay: 1,
      startTime: 1,
    });

    return res.status(200).json({
      slots: slots.map((slot) => ({
        id: slot._id,
        hostelId: slot.hostelId,
        weekDay: slot.weekDay,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxSlots: slot.maxSlots,
        maxBookingsPerUserPerWeek: slot.maxBookingsPerUserPerWeek,
        bookedSlots: slot.bookedSlots,
        availableSlots: Math.max(slot.maxSlots - slot.bookedSlots, 0),
      })),
    });
  } catch (error) {
    console.error("getRoomCleaningSlots error:", error);
    return res.status(500).json({
      message: "Failed to fetch room cleaning slots",
      error: String(error.message || error),
    });
  }
};

module.exports = {
  setRoomCleaningSlot,
  getRoomCleaningSlots,
};
