const { RoomCleaningBooking } = require("./roomCleaningBookingModel");
const { RcFeedback } = require("./roomCleaningFeedbackModel");
const { Hostel } = require("../hostel/hostelModel");
const { User } = require("../user/userModel");

const SLOTS = [
  { id: "A", timeRange: "12:00-14:00" },
  { id: "B", timeRange: "14:00-16:00" },
  { id: "C", timeRange: "16:00-18:00" },
  { id: "D", timeRange: "18:00-20:00" },
];

// IST helper: UTC+5:30
const IST_OFFSET_MINUTES = 5.5 * 60;

const getISTNow = () => {
  const now = new Date();
  const utcMillis = now.getTime() + now.getTimezoneOffset() * 60000;
  const istMillis = utcMillis + IST_OFFSET_MINUTES * 60000;
  return new Date(istMillis);
};

const startOfDayIST = (dateInput) => {
  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
};

const endOfDayIST = (dateInput) => {
  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
};

/**
 * Whether the booking window is currently open for the given booking date.
 * Window for date D: open = (D-3) at 09:00 IST, close = end of (D-2) IST.
 */
function isBookingWindowOpen(bookingDate, now = getISTNow()) {
  const d = startOfDayIST(bookingDate);
  const openDay = new Date(d);
  openDay.setDate(openDay.getDate() - 3);
  const openTime = new Date(
    openDay.getFullYear(),
    openDay.getMonth(),
    openDay.getDate(),
    9,
    0,
    0,
    0,
  );
  const closeDay = new Date(d);
  closeDay.setDate(closeDay.getDate() - 2);
  const closeTime = endOfDayIST(closeDay);
  return now >= openTime && now <= closeTime;
}

// Shared helper to validate targetDate (D+2 or D+3), resolve hostel,
// compute capacities and booking window.
async function resolveContext({ req, dateParam, allowWindowBypass = false }) {
  if (!req.user?._id) {
    const err = new Error("User not authenticated");
    err.statusCode = 401;
    throw err;
  }

  if (!dateParam) {
    const err = new Error("Query/body field 'date' (YYYY-MM-DD) is required");
    err.statusCode = 400;
    throw err;
  }

  const parsed = new Date(dateParam);
  if (Number.isNaN(parsed.getTime())) {
    const err = new Error("Provided 'date' is invalid");
    err.statusCode = 400;
    throw err;
  }

  const targetDate = startOfDayIST(parsed);
  const today = startOfDayIST(getISTNow());
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((targetDate - today) / msPerDay);

  if (diffDays !== 2 && diffDays !== 3) {
    const err = new Error("You can only operate on D+2 or D+3 from today");
    err.statusCode = 400;
    throw err;
  }

  // Determine hostel: either from query/body or from user's hostel field.
  let hostelId = req.query.hostelId || req.body.hostelId;
  if (!hostelId) {
    const user = await User.findById(req.user._id).select("hostel").lean();
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    hostelId = user.hostel;
    if (!hostelId) {
      const err = new Error("User is not associated with any hostel");
      err.statusCode = 400;
      throw err;
    }
  }

  const hostel = await Hostel.findById(hostelId)
    .select("roomCleaners hostel_name")
    .lean();
  if (!hostel) {
    const err = new Error("Hostel not found");
    err.statusCode = 404;
    throw err;
  }

  const N = typeof hostel.roomCleaners === "number" ? hostel.roomCleaners : 0;
  // Each cleaner can clean 3 rooms per hour; each slot is 2 hours.
  // primaryCapacity = max(N-1,0) * 3 * 2
  const primaryCapacity = Math.max(N - 1, 0) * 3 * 2;
  const bufferCapacity = 1 * 3 * 2;

  const now = getISTNow();

  const openDay = new Date(targetDate);
  openDay.setDate(openDay.getDate() - 3);
  const openTime = new Date(
    openDay.getFullYear(),
    openDay.getMonth(),
    openDay.getDate(),
    9,
    0,
    0,
    0,
  );

  const closeDay = new Date(targetDate);
  closeDay.setDate(closeDay.getDate() - 2);
  const closeTime = endOfDayIST(closeDay);

  if (!allowWindowBypass && (now < openTime || now > closeTime)) {
    const err = new Error("Booking window is not open for this date");
    err.statusCode = 400;
    err.details = { openTime, closeTime };
    throw err;
  }

  return {
    targetDate,
    hostelId,
    hostel,
    primaryCapacity,
    bufferCapacity,
    openTime,
    closeTime,
    now,
  };
}

/**
 * GET /api/room-cleaning/availability
 *
 * Called when the user opens the room-cleaning page.
 * - Only the user JWT is sent.
 * - Computes which future days currently have the booking window open
 *   (according to the D+2 / D+3 rules).
 * - For each such day, computes slot availability (primary + buffer).
 */
const getAvailability = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Resolve hostel purely from user's hostel field.
    const user = await User.findById(req.user._id).select("hostel").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.hostel) {
      return res
        .status(400)
        .json({ message: "User is not associated with any hostel" });
    }

    const hostelId = user.hostel;
    const hostel = await Hostel.findById(hostelId)
      .select("roomCleaners hostel_name")
      .lean();
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    const N = typeof hostel.roomCleaners === "number" ? hostel.roomCleaners : 0;
    const primaryCapacity = Math.max(N - 1, 0) * 3 * 2;
    const bufferCapacity = 1 * 3 * 2;

    const now = getISTNow();
    const today = startOfDayIST(now);

    // Global 14-day rule: if user has any Cleaned/Booked/Buffered booking
    // in the last 14 days (including today), canBook is false.
    const windowEnd = new Date(today);
    windowEnd.setDate(windowEnd.getDate() + 1); // exclusive
    const windowStart = new Date(today);
    windowStart.setDate(windowStart.getDate() - 13);

    const recentCount = await RoomCleaningBooking.countDocuments({
      userId: req.user._id,
      hostelId,
      bookingDate: { $gte: windowStart, $lt: windowEnd },
      status: { $in: ["Booked", "Buffered", "Cleaned"] },
    });

    if (recentCount >= 1) {
      return res.status(200).json({
        hostelId,
        hostelName: hostel.hostel_name || null,
        now,
        canBook: false,
        days: [],
      });
    }

    // Candidate target days: D+2 and D+3 relative to today.
    const deltas = [2, 3];
    const dayResults = [];

    for (const delta of deltas) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + delta);

      const openDay = new Date(targetDate);
      openDay.setDate(openDay.getDate() - 3);
      const openTime = new Date(
        openDay.getFullYear(),
        openDay.getMonth(),
        openDay.getDate(),
        9,
        0,
        0,
        0,
      );

      const closeDay = new Date(targetDate);
      closeDay.setDate(closeDay.getDate() - 2);
      const closeTime = endOfDayIST(closeDay);

      if (now < openTime || now > closeTime) {
        // Booking window not open for this specific target date.
        continue;
      }

      // Compute availability for this target date.
      const bookings = await RoomCleaningBooking.find({
        hostelId,
        bookingDate: targetDate,
        status: { $in: ["Booked", "Buffered"] },
      })
        .select("slot status")
        .lean();

      const slots = SLOTS.map((slotMeta) => {
        const slotId = slotMeta.id;
        const forSlot = bookings.filter((b) => b.slot === slotId);

        const primaryUsed = forSlot.filter(
          (b) => b.status === "Booked",
        ).length;
        const bufferUsed = forSlot.filter(
          (b) => b.status === "Buffered",
        ).length;

        const slotsLeft = Math.max(primaryCapacity - primaryUsed, 0);
        const bufferSlotsLeft =
          slotsLeft > 0 ? 0 : Math.max(bufferCapacity - bufferUsed, 0);

        return {
          slot: slotId,
          timeRange: slotMeta.timeRange,
          primaryCapacity,
          bufferCapacity,
          slotsLeft,
          bufferSlotsLeft,
        };
      });

      const dateIst = startOfDayIST(targetDate);
      const yyyy = dateIst.getFullYear();
      const mm = String(dateIst.getMonth() + 1).padStart(2, "0");
      const dd = String(dateIst.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      dayResults.push({
        // Calendar date in IST as YYYY-MM-DD string.
        date: dateStr,
        openTime,
        closeTime,
        slots,
      });
    }

    return res.status(200).json({
      hostelId,
      hostelName: hostel.hostel_name || null,
      now,
      canBook: dayResults.length > 0,
      days: dayResults,
    });
  } catch (error) {
    console.error("getAvailability error:", error);
    return res.status(500).json({
      message: "Failed to fetch room-cleaning availability",
      error: String(error.message || error),
    });
  }
};

/**
 * POST /api/room-cleaning/booking
 *
 * Body:
 *  - date: YYYY-MM-DD (target booking date)
 *  - slot: "A" | "B" | "C" | "D"
 *  - hostelId (optional): override hostel; otherwise inferred from user.hostel
 *
 * Rules:
 *  - Same D+2/D+3 and booking window constraints as availability.
 *  - Per user, per hostel: at most 1 booking in any rolling 14-day window,
 *    considering statuses: Booked, Buffered, Cleaned.
 *  - Capacity check using primary and buffer capacities.
 *  - Creates booking with status "Booked" if primary slots left,
 *    otherwise "Buffered" if buffer slots left; otherwise rejects.
 */
const createBooking = async (req, res) => {
  try {
    const { slot } = req.body || {};

    if (!SLOTS.some((s) => s.id === slot)) {
      return res.status(400).json({
        message: 'Invalid slot. Expected one of "A", "B", "C", "D".',
      });
    }

    const context = await resolveContext({
      req,
      dateParam: req.body.date,
      allowWindowBypass: false,
    });

    const {
      targetDate,
      hostelId,
      hostel,
      primaryCapacity,
      bufferCapacity,
    } = context;

    // Enforce "1 booking every 14 days" rule (Booked, Buffered, Cleaned).
    const windowEnd = new Date(targetDate);
    windowEnd.setDate(windowEnd.getDate() + 1); // exclusive
    const windowStart = new Date(targetDate);
    windowStart.setDate(windowStart.getDate() - 13);

    const recentCount = await RoomCleaningBooking.countDocuments({
      userId: req.user._id,
      hostelId,
      bookingDate: { $gte: windowStart, $lt: windowEnd },
      status: { $in: ["Booked", "Buffered", "Cleaned"] },
    });

    if (recentCount >= 1) {
      return res.status(400).json({
        message:
          "You can only have one room cleaning booking in any 14-day period.",
      });
    }

    // Capacity check for the chosen slot on the target date.
    const bookingsForSlot = await RoomCleaningBooking.find({
      hostelId,
      bookingDate: targetDate,
      slot,
      status: { $in: ["Booked", "Buffered"] },
    })
      .select("status")
      .lean();

    const primaryUsed = bookingsForSlot.filter(
      (b) => b.status === "Booked",
    ).length;
    const bufferUsed = bookingsForSlot.filter(
      (b) => b.status === "Buffered",
    ).length;

    const slotsLeft = Math.max(primaryCapacity - primaryUsed, 0);
    const bufferSlotsLeft =
      slotsLeft > 0 ? 0 : Math.max(bufferCapacity - bufferUsed, 0);

    if (slotsLeft <= 0 && bufferSlotsLeft <= 0) {
      return res.status(400).json({
        message: "No capacity left for this slot on the selected date.",
      });
    }

    const status = slotsLeft > 0 ? "Booked" : "Buffered";

    try {
      const booking = await RoomCleaningBooking.create({
        userId: req.user._id,
        hostelId,
        bookingDate: targetDate,
        slot,
        status,
      });

      return res.status(201).json({
        message: "Room cleaning booking created successfully.",
        booking,
        availability: {
          hostelId,
          hostelName: hostel.hostel_name || null,
          date: targetDate,
          slot,
          primaryCapacity,
          bufferCapacity,
          slotsLeft:
            status === "Booked" ? Math.max(slotsLeft - 1, 0) : slotsLeft,
          bufferSlotsLeft:
            status === "Buffered"
              ? Math.max(bufferSlotsLeft - 1, 0)
              : bufferSlotsLeft,
        },
      });
    } catch (err) {
      if (err?.code === 11000) {
        return res.status(409).json({
          message:
            "You already have a booking for this slot on this date in this hostel.",
        });
      }
      throw err;
    }
  } catch (error) {
    const status = error.statusCode || 500;
    if (status >= 500) {
      console.error("createBooking error:", error);
    }
    return res.status(status).json({
      message: error.message || "Failed to create room-cleaning booking",
      ...(error.details ? { details: error.details } : {}),
    });
  }
};

/**
 * POST /api/room-cleaning/booking/cancel
 *
 * Body:
 *  - bookingId: ObjectId
 *
 * Rules:
 *  - Only the booking owner can cancel.
 *  - Only future bookings (bookingDate > today) can be cancelled.
 *  - Only statuses Booked or Buffered can be cancelled.
 *  - Cancellation allowed only when the booking window for that date is open.
 */
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.body || {};
    if (!bookingId) {
      return res
        .status(400)
        .json({ message: "Field 'bookingId' is required" });
    }

    if (!req.user?._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const booking = await RoomCleaningBooking.findOne({
      _id: bookingId,
      userId: req.user._id,
    });

    if (!booking) {
      return res
        .status(404)
        .json({ message: "Booking not found for this user" });
    }

    if (!["Booked", "Buffered"].includes(booking.status)) {
      return res.status(400).json({
        message: "Only Booked or Buffered bookings can be cancelled",
      });
    }

    const today = startOfDayIST(getISTNow());
    const bookingDate = startOfDayIST(booking.bookingDate);
    if (bookingDate <= today) {
      return res.status(400).json({
        message: "Past or same-day bookings cannot be cancelled",
      });
    }

    if (!isBookingWindowOpen(booking.bookingDate)) {
      return res.status(400).json({
        message:
          "Cancellation is only allowed while the booking window for this date is open",
      });
    }

    booking.status = "Cancelled";
    await booking.save();

    return res.status(200).json({
      message: "Room cleaning booking cancelled successfully",
      booking,
    });
  } catch (error) {
    console.error("cancelBooking error:", error);
    return res.status(500).json({
      message: "Failed to cancel room-cleaning booking",
      error: String(error.message || error),
    });
  }
};

/**
 * GET /api/room-cleaning/booking/my
 *
 * Returns all room-cleaning bookings for the authenticated user,
 * sorted by bookingDate desc then createdAt desc.
 * Each booking includes canCancel: true only when status is Booked/Buffered,
 * bookingDate is in the future, and the booking window for that date is open.
 */
const getMyBookings = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const bookings = await RoomCleaningBooking.find({
      userId: req.user._id,
    })
      .sort({ bookingDate: -1, createdAt: -1 })
      .select("_id bookingDate slot status hostelId feedbackId reason")
      .lean();

    const today = startOfDayIST(getISTNow());
    const list = bookings.map((b) => {
      const bookingDate = startOfDayIST(b.bookingDate);
      const future = bookingDate > today;
      const cancellableStatus =
        b.status === "Booked" || b.status === "Buffered";
      const windowOpen = future && isBookingWindowOpen(b.bookingDate);
      const canCancel = cancellableStatus && future && windowOpen;
      return { ...b, canCancel };
    });

    return res.status(200).json({ bookings: list });
  } catch (error) {
    console.error("getMyBookings error:", error);
    return res.status(500).json({
      message: "Failed to fetch room-cleaning bookings",
      error: String(error.message || error),
    });
  }
};

/**
 * POST /api/room-cleaning/booking/feedback
 *
 * Body:
 *  - bookingId: ObjectId
 *  - reachedInSlot: "Yes" | "No" | "NotSure"
 *  - staffPoliteness: "Yes" | "No" | "NotSure"
 *  - satisfaction: 1–5
 *  - remarks?: string
 */
const submitFeedback = async (req, res) => {
  try {
    const { bookingId, reachedInSlot, staffPoliteness, satisfaction, remarks } =
      req.body || {};

    if (!bookingId) {
      return res
        .status(400)
        .json({ message: "Field 'bookingId' is required" });
    }

    if (!req.user?._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const booking = await RoomCleaningBooking.findOne({
      _id: bookingId,
      userId: req.user._id,
    }).lean();

    if (!booking) {
      return res
        .status(404)
        .json({ message: "Booking not found for this user" });
    }

    if (booking.status !== "Cleaned") {
      return res.status(400).json({
        message: "Feedback can only be submitted for cleaned bookings",
      });
    }

    if (booking.feedbackId) {
      return res.status(400).json({
        message: "Feedback has already been submitted for this booking",
      });
    }

    const allowedBinary = ["Yes", "No", "NotSure"];
    if (!allowedBinary.includes(reachedInSlot)) {
      return res.status(400).json({
        message:
          "Field 'reachedInSlot' must be one of Yes, No, NotSure",
      });
    }
    if (!allowedBinary.includes(staffPoliteness)) {
      return res.status(400).json({
        message:
          "Field 'staffPoliteness' must be one of Yes, No, NotSure",
      });
    }

    const parsedSatisfaction = Number(satisfaction);
    if (
      !Number.isFinite(parsedSatisfaction) ||
      parsedSatisfaction < 1 ||
      parsedSatisfaction > 5
    ) {
      return res.status(400).json({
        message: "Field 'satisfaction' must be a number between 1 and 5",
      });
    }

    const session = await RoomCleaningBooking.startSession();
    session.startTransaction();
    try {
      const [feedbackDoc] = await RcFeedback.create(
        [
          {
            userId: req.user._id,
            bookingId: booking._id,
            hostelId: booking.hostelId,
            reachedInSlot,
            staffPoliteness,
            satisfaction: parsedSatisfaction,
            remarks: remarks ? String(remarks) : "",
          },
        ],
        { session },
      );

      await RoomCleaningBooking.updateOne(
        { _id: booking._id },
        { $set: { feedbackId: feedbackDoc._id } },
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        message: "Feedback submitted successfully",
        feedbackId: feedbackDoc._id,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      if (err?.code === 11000) {
        return res.status(409).json({
          message: "Feedback already exists for this booking",
        });
      }
      throw err;
    }
  } catch (error) {
    console.error("submitFeedback error:", error);
    return res.status(500).json({
      message: "Failed to submit room-cleaning feedback",
      error: String(error.message || error),
    });
  }
};

/**
 * RC Manager: GET tomorrow's bookings for the manager's hostel.
 * Requires authenticateMessManagerJWT (req.managerHostel).
 * Query: date (optional) YYYY-MM-DD; default is tomorrow in IST.
 * Returns: { bookings: [ { _id, roomNumber, slot, timeRange, assignedTo } ], totalCleaners }
 */
const getRcTomorrow = async (req, res) => {
  try {
    const hostel = req.managerHostel;
    if (!hostel) {
      return res.status(403).json({ message: "Manager hostel not set" });
    }

    const dateParam = req.query.date;
    let tomorrowStart;
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ message: "Invalid date" });
      }
      tomorrowStart = startOfDayIST(parsed);
    } else {
      const now = getISTNow();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrowStart = startOfDayIST(tomorrow);
    }

    const bookings = await RoomCleaningBooking.find({
      hostelId: hostel._id,
      bookingDate: tomorrowStart,
      status: { $ne: "Cancelled" },
    })
      .sort({ slot: 1, createdAt: 1 })
      .select("_id userId slot assignedTo status statusFinalizedAt")
      .lean();

    const userIds = [...new Set(bookings.map((b) => b.userId).filter(Boolean))];
    const userMap = {};
    if (userIds.length > 0) {
      const users = await User.find({ _id: { $in: userIds } })
        .select("_id roomNumber phoneNumber")
        .lean();
      for (const u of users) {
        const key = u._id.toString();
        userMap[key] = {
          roomNumber: u.roomNumber != null ? String(u.roomNumber) : "—",
          phoneNumber: u.phoneNumber != null ? String(u.phoneNumber) : "—",
        };
      }
    }

    const totalCleaners = typeof hostel.roomCleaners === "number" ? hostel.roomCleaners : 0;
    const slotMap = Object.fromEntries(SLOTS.map((s) => [s.id, s.timeRange]));

    const list = bookings.map((b) => {
      const u = userMap[b.userId?.toString()];
      return {
        _id: b._id,
        roomNumber: u?.roomNumber ?? "—",
        phoneNumber: u?.phoneNumber ?? "—",
        slot: b.slot,
        timeRange: slotMap[b.slot] || "",
        assignedTo: b.assignedTo ?? null,
        status: b.status ?? null,
        statusFinalizedAt: b.statusFinalizedAt ?? null,
      };
    });

    return res.status(200).json({ bookings: list, totalCleaners });
  } catch (err) {
    console.error("getRcTomorrow error:", err);
    return res.status(500).json({
      message: "Failed to fetch tomorrow bookings",
      error: String(err?.message || err),
    });
  }
};

/**
 * RC Manager: POST to save assignments for tomorrow.
 * Requires authenticateMessManagerJWT.
 * Body: { date? (YYYY-MM-DD), assignments: [ { bookingId, assignedTo } ] }
 * assignedTo: number 1..N or null/omit for unassigned.
 */
const postRcTomorrowAssign = async (req, res) => {
  try {
    const hostel = req.managerHostel;
    if (!hostel) {
      return res.status(403).json({ message: "Manager hostel not set" });
    }

    const { date: dateParam, assignments } = req.body || {};
    if (!Array.isArray(assignments)) {
      return res.status(400).json({ message: "assignments must be an array" });
    }

    let tomorrowStart;
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ message: "Invalid date" });
      }
      tomorrowStart = startOfDayIST(parsed);
    } else {
      const now = getISTNow();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrowStart = startOfDayIST(tomorrow);
    }

    const N = typeof hostel.roomCleaners === "number" ? hostel.roomCleaners : 0;

    for (const item of assignments) {
      const { bookingId, assignedTo } = item;
      if (!bookingId) continue;

      const filter = {
        _id: bookingId,
        hostelId: hostel._id,
        bookingDate: tomorrowStart,
      };

      if (assignedTo == null || assignedTo === "" || assignedTo === 0) {
        await RoomCleaningBooking.updateOne(filter, { $unset: { assignedTo: 1 } });
      } else {
        const num = Number(assignedTo);
        if (num < 1 || num > N) {
          return res.status(400).json({
            message: `assignedTo must be between 1 and ${N} for booking ${bookingId}`,
          });
        }
        await RoomCleaningBooking.updateOne(filter, { $set: { assignedTo: num } });
      }
    }

    return res.status(200).json({ message: "Assignments saved" });
  } catch (err) {
    console.error("postRcTomorrowAssign error:", err);
    return res.status(500).json({
      message: "Failed to save assignments",
      error: String(err?.message || err),
    });
  }
};

/**
 * RC Manager: POST to finalize booking statuses for a date.
 * Requires authenticateMessManagerJWT.
 *
 * Body:
 * {
 *   date: 'YYYY-MM-DD', // required
 *   updates: [ { bookingId, status, reason? } ]
 * }
 *
 * Allowed status transitions (for manager finalization):
 * - Cleaned (reason cleared)
 * - CouldNotBeCleaned (requires reason in allowed set)
 *
 * Only updates bookings that belong to the manager hostel and match bookingDate.
 */
const postRcFinalizeStatuses = async (req, res) => {
  try {
    const hostel = req.managerHostel;
    if (!hostel) {
      return res.status(403).json({ message: "Manager hostel not set" });
    }

    const { date: dateParam, updates } = req.body || {};
    if (!dateParam) {
      return res.status(400).json({ message: "date is required (YYYY-MM-DD)" });
    }
    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: "updates must be an array" });
    }

    const parsed = new Date(dateParam);
    if (Number.isNaN(parsed.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }
    const targetDate = startOfDayIST(parsed);

    const allowedReasons = new Set([
      "Student Did Not Respond",
      "Student Asked To Cancel",
      "Room Cleaners Not Available",
    ]);

    let updated = 0;
    let locked = 0;
    const now = new Date();

    for (const item of updates) {
      const { bookingId, status, reason } = item || {};
      if (!bookingId) continue;
      if (!status) {
        return res.status(400).json({
          message: `status is required for booking ${bookingId}`,
        });
      }

      if (!["Cleaned", "CouldNotBeCleaned"].includes(status)) {
        return res.status(400).json({
          message: `Invalid status "${status}" for booking ${bookingId}`,
        });
      }

      const filter = {
        _id: bookingId,
        hostelId: hostel._id,
        bookingDate: targetDate,
        status: { $in: ["Booked", "Buffered", "Cleaned", "CouldNotBeCleaned"] },
        statusFinalizedAt: null,
      };

      if (status === "Cleaned") {
        const r = await RoomCleaningBooking.updateOne(filter, {
          $set: { status: "Cleaned", statusFinalizedAt: now },
          $unset: { reason: 1 },
        });
        if (r?.modifiedCount) updated += 1;
        else locked += 1;
      } else {
        if (!reason || !allowedReasons.has(reason)) {
          return res.status(400).json({
            message: `reason must be one of [${[...allowedReasons].join(
              ", ",
            )}] for booking ${bookingId}`,
          });
        }
        const r = await RoomCleaningBooking.updateOne(filter, {
          $set: { status: "CouldNotBeCleaned", reason, statusFinalizedAt: now },
        });
        if (r?.modifiedCount) updated += 1;
        else locked += 1;
      }
    }

    return res.status(200).json({
      message: "Statuses finalized",
      updated,
      locked,
    });
  } catch (err) {
    console.error("postRcFinalizeStatuses error:", err);
    return res.status(500).json({
      message: "Failed to finalize statuses",
      error: String(err?.message || err),
    });
  }
};

module.exports = {
  getAvailability,
  createBooking,
  cancelBooking,
  getMyBookings,
  submitFeedback,
  getRcTomorrow,
  postRcTomorrowAssign,
  postRcFinalizeStatuses,
};

