const { User } = require("../../user/userModel.js");
const { Hostel } = require("../../hostel/hostelModel.js");
const UserAllocHostel = require("../../hostel/hostelAllocModel.js");
const { MessChange } = require("../messChangeModel.js");
const { MessChangeSettings } = require("../messChangeSettingsModel.js");
const {
  sendNotificationMessage,
  sendNotificationToUser,
} = require("../../notification/notificationController.js");

// ==========================================
// Helper Functions
// ==========================================

/**
 * Initialize capacity tracker
 * upperCap =
 *   - floor(1.2 * max_capacity) when max_capacity < 400
 *   - floor(1.15 * max_capacity) when 400 <= max_capacity < 1000
 *   - floor(1.1 * max_capacity) when max_capacity = 1000
 *   - floor(1.05 * max_capacity) when max_capacity > 1000
 * lowerCap = floor(0.9 * max_capacity)
 */
const initializeCapacityTracker = async (hostels) => {
  const capacityTracker = {};

  const subscriberRows = await UserAllocHostel.aggregate([
    {
      $match: {
        current_subscribed_mess: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$current_subscribed_mess",
        count: { $sum: 1 },
      },
    },
  ]);

  const subscriberByHostel = new Map(
    subscriberRows.map((row) => [String(row._id), row.count]),
  );

  for (const hostel of hostels) {
    const current = subscriberByHostel.get(hostel._id.toString()) || 0;

    const maxCap = hostel.curr_cap || 200;
    let upperMultiplier = 1.2;
    if (maxCap > 1000) {
      upperMultiplier = 1.05;
    } else if (maxCap === 1000) {
      upperMultiplier = 1.1;
    } else if (maxCap >= 400) {
      upperMultiplier = 1.15;
    }

    const upperCap = Math.floor(upperMultiplier * maxCap);
    const lowerCap = Math.floor(0.9 * maxCap);

    capacityTracker[hostel._id.toString()] = {
      current,
      available: upperCap - current,
      lowerCap,
    };
  }

  return capacityTracker;
};

/**
 * Sort users by FCFS priority
 */
const normalizeRoll = (value) =>
  value === null || value === undefined
    ? ""
    : String(value).trim().toUpperCase();

const sortUsersByPriority = (users) =>
  users.sort((a, b) => a.applied_hostel_timestamp - b.applied_hostel_timestamp);

/**
 * Core processing function:
 * Restart-based FCFS with
 * - upper cap on entry
 * - lower cap on exit
 */
const processUsersInIterations = async (users, capacityTracker) => {
  const queue = sortUsersByPriority([...users]);
  const state = new Map();

  for (const u of queue) {
    const hostelId = u.hostel?.toString() || null;
    state.set(u._id.toString(), {
      id: u._id.toString(),
      name: u.name,
      rollNumber: u.rollNumber,
      hostelId,
      currentMess: hostelId,
      prefs: [
        u.next_mess1?.toString() || null,
        u.next_mess2?.toString() || null,
        u.next_mess3?.toString() || null,
      ],
      resolved: false,
    });
  }

  const acceptedUsers = [];

  while (true) {
    let moved = false;

    for (const user of queue) {
      const st = state.get(user._id.toString());
      if (!st || st.resolved) continue;

      // Find highest available preference
      let target = null;
      for (const pref of st.prefs) {
        if (pref && capacityTracker[pref]?.available > 0) {
          target = pref;
          break;
        }
      }
      if (!target) continue;

      const from = st.currentMess;
      const fromTracker = capacityTracker[from];

      // Lower bound (90%) check
      if (fromTracker && fromTracker.current - 1 < fromTracker.lowerCap) {
        continue;
      }

      // Perform move
      capacityTracker[target].available -= 1;
      capacityTracker[target].current += 1;

      if (fromTracker) {
        fromTracker.available += 1;
        fromTracker.current -= 1;
      }

      st.currentMess = target;
      st.resolved = true;

      acceptedUsers.push({
        id: st.id,
        name: st.name,
        rollNumber: st.rollNumber,
        fromHostelId: from,
        toHostelId: target,
      });

      moved = true;
      break; // restart FCFS scan
    }

    if (!moved) break;
  }

  const rejectedUsers = queue
    .filter((u) => !state.get(u._id.toString())?.resolved)
    .map((u) => ({
      id: u._id,
      name: u.name,
      rollNumber: u.rollNumber,
      fromHostelId: state.get(u._id.toString())?.hostelId || u.hostel,
      toHostelId: null,
    }));

  return { acceptedUsers, rejectedUsers };
};

/**
 * Reset all users back to their hostel
 */
const resetAllUsersToHostel = async () => {
  try {
    const allocations = await UserAllocHostel.find({});

    for (const allocation of allocations) {
      allocation.current_subscribed_mess = allocation.hostel;
      await allocation.save();

      await User.updateOne(
        { rollNumber: allocation.rollno },
        {
          $set: {
            curr_subscribed_mess: allocation.hostel,
            got_mess_changed: false,
          },
        },
      );
    }
  } catch (err) {
    console.error("Error resetting users to hostel:", err);
  }
};

/**
 * Update accepted users
 */
const updateAcceptedUsers = async (acceptedUsers) => {
  for (const a of acceptedUsers) {
    const user = await User.findById(a.id);
    if (!user) continue;

    if (user.rollNumber) {
      await UserAllocHostel.updateOne(
        { rollno: normalizeRoll(user.rollNumber) },
        {
          $set: {
            current_subscribed_mess: a.toHostelId,
          },
        },
        { upsert: false },
      );
    }

    const [fromHostel, toHostel] = await Promise.all([
      Hostel.findById(a.fromHostelId),
      Hostel.findById(a.toHostelId),
    ]);

    user.curr_subscribed_mess = a.toHostelId;
    user.applied_for_mess_changed = false;
    user.got_mess_changed = true;
    user.applied_hostel_string = "";
    user.next_mess1 = null;
    user.next_mess2 = null;
    user.next_mess3 = null;
    user.applied_hostel_timestamp = null;
    await user.save();

    await MessChange.findOneAndUpdate(
      { rollNumber: normalizeRoll(user.rollNumber) },
      {
        userName: user.name,
        rollNumber: normalizeRoll(user.rollNumber),
        fromHostel: fromHostel?.hostel_name || "Unknown",
        toHostel: toHostel?.hostel_name || "Unknown",
        toHostel1: toHostel?.hostel_name || "Unknown",
      },
      { upsert: true },
    );

    try {
      await sendNotificationToUser(
        user._id,
        "Mess Change Accepted",
        `Your mess change has been approved to ${toHostel?.hostel_name}.`,
      );
    } catch {}
  }
};

/**
 * Update rejected users
 */
const updateRejectedUsers = async (rejectedUsers) => {
  for (const r of rejectedUsers) {
    const user = await User.findById(r.id);
    if (!user) continue;

    if (user.rollNumber) {
      await UserAllocHostel.updateOne(
        { rollno: normalizeRoll(user.rollNumber) },
        {
          $set: {
            current_subscribed_mess: user.hostel,
          },
        },
        { upsert: false },
      );
    }

    user.curr_subscribed_mess = user.hostel;
    user.applied_for_mess_changed = false;
    user.applied_hostel_string = "";
    user.next_mess1 = null;
    user.next_mess2 = null;
    user.next_mess3 = null;
    user.got_mess_changed = false;
    await user.save();

    try {
      await sendNotificationToUser(
        user._id,
        "Mess Change Rejected",
        "Your mess change request was not approved this cycle.",
      );
    } catch {}
  }
};

/**
 * Update last processed timestamp
 */
const updateLastProcessedTimestamp = async () => {
  let settings = await MessChangeSettings.findOne();
  if (!settings) settings = new MessChangeSettings();

  settings.isEnabled = false;
  settings.lastProcessedAt = new Date();
  settings.disabledAt = new Date();
  await settings.save();
};

// ==========================================
// Controllers
// ==========================================

const processAllMessChangeRequests = async (req, res) => {
  try {
    const users = await User.find({ applied_for_mess_changed: true });
    if (!users.length) {
      return res.status(400).json({ message: "No mess change requests found" });
    }

    await User.updateMany({}, { got_mess_changed: false });
    await resetAllUsersToHostel();

    const hostels = await Hostel.find({});
    const capacityTracker = await initializeCapacityTracker(hostels);

    const { acceptedUsers, rejectedUsers } = processUsersInIterations(
      users,
      capacityTracker,
    );

    await updateAcceptedUsers(acceptedUsers);
    await updateRejectedUsers(rejectedUsers);
    await updateLastProcessedTimestamp();

    sendNotificationMessage(
      "MESS CHANGE",
      "Mess Change is Disabled",
      "All_Hostels",
      { redirectType: "mess_change", isAlert: "true" },
    );

    res.status(200).json({
      message: `${acceptedUsers.length} accepted, ${rejectedUsers.length} rejected`,
      acceptedUsers,
      rejectedUsers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const rejectAllMessChangeRequests = async (req, res) => {
  try {
    const users = await User.find({ applied_for_mess_changed: true });
    if (!users.length) {
      return res
        .status(400)
        .json({ message: "No pending mess change requests found" });
    }

    for (const user of users) {
      user.applied_for_mess_changed = false;
      user.applied_hostel_string = "";
      user.next_mess1 = null;
      user.next_mess2 = null;
      user.next_mess3 = null;
      user.got_mess_changed = false;
      await user.save();
    }

    await updateLastProcessedTimestamp();

    sendNotificationMessage(
      "MESS CHANGE",
      "Mess Change is Disabled",
      "All_Hostels",
      { redirectType: "mess_change", isAlert: "true" },
    );

    res.status(200).json({
      message: `Rejected ${users.length} pending requests. Mess change has been automatically disabled.`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  processAllMessChangeRequests,
  rejectAllMessChangeRequests,
  resetAllUsersToHostel,
  updateLastProcessedTimestamp,
};
