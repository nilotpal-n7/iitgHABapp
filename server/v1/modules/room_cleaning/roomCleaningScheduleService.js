const {
  RoomCleaningSlot,
  RoomCleaningBooking,
  RoomCleaningSchedule,
} = require("./roomCleaningModel");
const { Hostel } = require("../hostel/hostelModel");

const startOfDay = (dateInput) => {
  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
};

const buildFinalScheduleForSlotDate = async ({ slotDoc, requestedDate }) => {
  if (!slotDoc?._id || !requestedDate) return null;
  const requestedDayStart = startOfDay(requestedDate);
  if (new Date() < requestedDayStart) return null;

  const existingSchedule = await RoomCleaningSchedule.findOne({
    slot: slotDoc._id,
    scheduleDate: requestedDayStart,
  }).lean();
  if (existingSchedule?.scheduleGenerated) return existingSchedule;

  const bookings = await RoomCleaningBooking.find({
    slot: slotDoc._id,
    requestedDate: requestedDayStart,
    status: "confirmed",
  })
    .populate("user", "name rollNumber roomNumber hostel")
    .lean();

  const hostelIds = [
    ...new Set(bookings.map((b) => String(b.hostelId || b.user?.hostel || "")).filter(Boolean)),
  ];

  const hostels = await Hostel.find({ _id: { $in: hostelIds } })
    .select("_id hostel_name")
    .lean();
  const hostelNameById = new Map(hostels.map((h) => [String(h._id), h.hostel_name]));

  const finalSchedule = bookings.map((booking) => {
    const hostelId = booking.hostelId || booking.user?.hostel;
    const hostelIdStr = hostelId ? String(hostelId) : "";
    return {
      userId: booking.user?._id,
      userName: booking.user?.name || "Unknown User",
      rollNumber: booking.user?.rollNumber || "",
      roomNumber: booking.user?.roomNumber || "",
      hostelId,
      hostelName: hostelNameById.get(hostelIdStr) || "",
    };
  });

  const updatedSchedule = await RoomCleaningSchedule.findOneAndUpdate(
    { slot: slotDoc._id, scheduleDate: requestedDayStart },
    {
      $set: {
        scheduleDate: requestedDayStart,
        hostelId: slotDoc.hostelId,
        finalSchedule,
        scheduleGenerated: true,
        scheduleGeneratedAt: new Date(),
      },
      $setOnInsert: {
        pdfUrl: "",
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return updatedSchedule || slotDoc;
};

const upsertRoomCleaningSchedulePdf = async ({
  slotId,
  hostelId,
  requestedDate,
  pdfUrl,
}) => {
  if (!slotId || pdfUrl === undefined || !requestedDate) return null;
  const requestedDayStart = startOfDay(requestedDate);

  return RoomCleaningSchedule.findOneAndUpdate(
    { slot: slotId, scheduleDate: requestedDayStart },
    {
      $set: {
        pdfUrl,
        ...(hostelId ? { hostelId } : {}),
      },
      $setOnInsert: {
        scheduleDate: requestedDayStart,
        hostelId,
        scheduleGenerated: false,
        scheduleGeneratedAt: null,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const generateFinalSchedulesForDueRequestedDates = async (extraQuery = {}) => {
  const todayStart = startOfDay(new Date());
  const bookingQuery = {
    status: "confirmed",
    requestedDate: { $lte: todayStart },
  };

  if (Object.keys(extraQuery).length) {
    const filteredSlots = await RoomCleaningSlot.find(extraQuery)
      .select("_id")
      .lean();
    const filteredSlotIds = filteredSlots.map((slot) => slot._id);
    if (!filteredSlotIds.length) return;
    bookingQuery.slot = { $in: filteredSlotIds };
  }

  const dueBookings = await RoomCleaningBooking.find(bookingQuery)
    .select("slot requestedDate")
    .lean();

  if (!dueBookings.length) return;

  const uniquePairs = new Map();
  for (const booking of dueBookings) {
    const key = `${String(booking.slot)}::${new Date(booking.requestedDate).toISOString()}`;
    uniquePairs.set(key, {
      slotId: String(booking.slot),
      requestedDate: booking.requestedDate,
    });
  }

  const slotIds = [...new Set([...uniquePairs.values()].map((v) => v.slotId))];
  const slots = await RoomCleaningSlot.find({ _id: { $in: slotIds } }).lean();
  const slotById = new Map(slots.map((slot) => [String(slot._id), slot]));

  for (const pair of uniquePairs.values()) {
    const slotDoc = slotById.get(pair.slotId);
    if (!slotDoc) continue;
    await buildFinalScheduleForSlotDate({
      slotDoc,
      requestedDate: pair.requestedDate,
    });
  }
};

module.exports = {
  buildFinalScheduleForSlotDate,
  generateFinalSchedulesForDueRequestedDates,
  upsertRoomCleaningSchedulePdf,
};
