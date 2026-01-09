const { User } = require("../../user/userModel.js");
const { Hostel } = require("../../hostel/hostelModel.js");
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
 * Initialize capacity tracker for all hostels
 */
const initializeCapacityTracker = async (hostels) => {
  const capacityTracker = {};
  for (const hostel of hostels) {
    const currentCount = await User.countDocuments({
      curr_subscribed_mess: hostel._id,
    });
    capacityTracker[hostel._id.toString()] = {
      available: (hostel.curr_cap || 200) - currentCount,
    };
  }
  console.log("capacityTracker", capacityTracker);
  return capacityTracker;
};

/**
 * Sort users by priority (applied timestamp)
 */
const sortUsersByPriority = (users) => {
  return users.sort(
    (a, b) => a.applied_hostel_timestamp - b.applied_hostel_timestamp
  );
};

/**
 * Core processing function: strictly FCFS with rounds per preference and cascading waitlists
 */
const processUsersInIterations = (users, capacityTracker) => {
  // Build user state with current mess and preferences
  const state = new Map();
  const queueOrder = sortUsersByPriority(users);
  for (const u of queueOrder) {
    state.set(u._id.toString(), {
      id: u._id.toString(),
      name: u.name,
      rollNumber: u.rollNumber,
      currentMess: u.curr_subscribed_mess?.toString() || u.hostel?.toString(),
      prefs: [
        u.next_mess1?.toString() || null,
        u.next_mess2?.toString() || null,
        u.next_mess3?.toString() || null,
      ],
    });
  }

  const acceptedUsers = [];
  const acceptedSet = new Set();

  const performMove = (userId, toMess, roundAcceptedUsers, waitlists) => {
    const st = state.get(userId);
    if (!st) return;
    const from = st.currentMess;

    // apply move
    capacityTracker[toMess].available -= 1;
    if (from) capacityTracker[from].available += 1;

    // record acceptance only once per user (on the round they get allocated)
    if (!acceptedSet.has(userId)) {
      roundAcceptedUsers.push({
        id: st.id,
        name: st.name,
        rollNumber: st.rollNumber,
        fromHostelId: from,
        toHostelId: toMess,
      });
      acceptedSet.add(userId);
    } else {
      // If somehow re-moving same user in cascade of same round, ensure the top-level record reflects final toMess
      const idx = roundAcceptedUsers.findIndex((r) => r.id === userId);
      if (idx >= 0) {
        roundAcceptedUsers[idx].toHostelId = toMess;
      }
    }

    st.currentMess = toMess;

    // After freeing a seat in 'from', immediately satisfy earliest waitlist for 'from'
    if (from && capacityTracker[from].available > 0) {
      const wl = waitlists.get(from);
      while (capacityTracker[from].available > 0 && wl && wl.length > 0) {
        const nextUserId = wl.shift();
        // Skip if already accepted in this or previous cascade (defensive)
        const nextState = state.get(nextUserId);
        if (!nextState || nextState.currentMess === from) continue;
        if (capacityTracker[from].available <= 0) break;
        performMove(nextUserId, from, roundAcceptedUsers, waitlists);
      }
    }
  };

  const processRound = (prefIndex) => {
    const roundAcceptedUsers = [];
    const waitlists = new Map(); // messId -> [userIds]

    for (const user of queueOrder) {
      const id = user._id.toString();
      if (acceptedSet.has(id)) continue; // already got a better (earlier) preference
      const st = state.get(id);
      if (!st) continue;
      const toMess = st.prefs[prefIndex];
      const from = st.currentMess;
      if (!toMess || toMess === from) continue;

      // if capacity available allocate, else enqueue to waitlist
      if (capacityTracker[toMess]?.available > 0) {
        performMove(id, toMess, roundAcceptedUsers, waitlists);
      } else {
        if (!waitlists.has(toMess)) waitlists.set(toMess, []);
        waitlists.get(toMess).push(id);
      }
    }

    // Nothing more to do; any cascades are handled immediately inside performMove
    return roundAcceptedUsers;
  };

  // Round 1: first preferences
  const r1 = processRound(0);
  for (const a of r1) acceptedUsers.push(a);
  // Round 2: second preferences for remaining users
  const r2 = processRound(1);
  for (const a of r2) acceptedUsers.push(a);
  // Round 3: third preferences for remaining users
  const r3 = processRound(2);
  for (const a of r3) acceptedUsers.push(a);

  // Remaining users are rejected
  const rejectedUsers = queueOrder
    .filter((u) => !acceptedSet.has(u._id.toString()))
    .map((user) => ({
      id: user._id,
      name: user.name,
      rollNumber: user.rollNumber,
      fromHostelId: user.hostel,
      toHostelId: null,
    }));

  return { acceptedUsers, rejectedUsers };
};

/**
 * Reset all users back to their hostel
 */
const resetAllUsersToHostel = async () => {
  try {
    // Reset ALL users who changed their mess (curr_subscribed_mess != hostel) back to their hostel
    const usersToReset = await User.find({
      $expr: {
        $ne: [{ $toString: "$curr_subscribed_mess" }, { $toString: "$hostel" }],
      },
    });

    let resetCount = 0;
    for (const user of usersToReset) {
      // Reset curr_subscribed_mess to hostel id
      user.curr_subscribed_mess = user.hostel;
      user.got_mess_changed = false;
      await user.save();
      resetCount++;
    }

    if (resetCount > 0) {
      console.log(
        `✅ Reset ${resetCount} users' mess subscription to their hostel of residence`
      );
    }
    return resetCount;
  } catch (error) {
    console.error("❌ Error resetting users to hostel:", error);
    return 0;
  }
};

/**
 * Database update function for accepted users
 */
const updateAcceptedUsers = async (acceptedUsers) => {
  for (const acceptedUser of acceptedUsers) {
    const user = await User.findById(acceptedUser.id);
    if (!user) continue;

    // Resolve from/to hostel names first
    const [fromHostel, toHostel] = await Promise.all([
      Hostel.findById(acceptedUser.fromHostelId),
      Hostel.findById(acceptedUser.toHostelId),
    ]);

    // Resolve preference hostel names BEFORE clearing them on user
    const [pref1, pref2, pref3] = await Promise.all([
      user.next_mess1
        ? Hostel.findById(user.next_mess1)
        : Promise.resolve(null),
      user.next_mess2
        ? Hostel.findById(user.next_mess2)
        : Promise.resolve(null),
      user.next_mess3
        ? Hostel.findById(user.next_mess3)
        : Promise.resolve(null),
    ]);

    const pref1Name = pref1 ? pref1.hostel_name : undefined;
    const pref2Name = pref2 ? pref2.hostel_name : undefined;
    const pref3Name = pref3 ? pref3.hostel_name : undefined;

    // Update user state
    user.curr_subscribed_mess = acceptedUser.toHostelId;
    user.applied_for_mess_changed = false;
    user.got_mess_changed = true;
    user.applied_hostel_string = "";
    user.next_mess1 = null;
    user.next_mess2 = null;
    user.next_mess3 = null;
    user.applied_hostel_timestamp = null;
    console.log("user", user);
    await user.save();

    // Check if a MessChange record already exists for this user
    const existingRecord = await MessChange.findOne({
      rollNumber: user.rollNumber,
    });

    const payload = {
      userName: user.name,
      rollNumber: user.rollNumber,
      fromHostel: fromHostel ? fromHostel.hostel_name : "Unknown",
      toHostel: toHostel ? toHostel.hostel_name : "Unknown",
      // toHostel1 is compulsory; fallback to final allocated if preference missing
      toHostel1: pref1Name || (toHostel ? toHostel.hostel_name : "Unknown"),
      // Optional preferences
      ...(pref2Name ? { toHostel2: pref2Name } : {}),
      ...(pref3Name ? { toHostel3: pref3Name } : {}),
    };

    if (existingRecord) {
      // Update existing record
      existingRecord.userName = payload.userName;
      existingRecord.fromHostel = payload.fromHostel;
      existingRecord.toHostel = payload.toHostel;
      existingRecord.toHostel1 = payload.toHostel1;
      if (pref2Name) existingRecord.toHostel2 = pref2Name;
      else existingRecord.toHostel2 = undefined;
      if (pref3Name) existingRecord.toHostel3 = pref3Name;
      else existingRecord.toHostel3 = undefined;
      await existingRecord.save();
    } else {
      // Create new record
      const messChangeRecord = new MessChange(payload);
      await messChangeRecord.save();
    }

    acceptedUser.fromHostel = fromHostel ? fromHostel.hostel_name : "Unknown";
    acceptedUser.toHostel = toHostel ? toHostel.hostel_name : "Unknown";

    // Notify user on acceptance
    try {
      await sendNotificationToUser(
        user._id,
        "Mess Change Accepted",
        `Your mess change has been approved to ${acceptedUser.toHostel}.`
      );
    } catch (e) {
      console.log("Failed to send acceptance notification", e);
    }
  }
};

/**
 * Database update function for rejected users
 */
const updateRejectedUsers = async (rejectedUsers) => {
  for (const rejectedUser of rejectedUsers) {
    const user = await User.findById(rejectedUser.id);
    if (!user) continue;

    user.applied_for_mess_changed = false;
    user.applied_hostel_string = "";
    user.next_mess1 = null;
    user.next_mess2 = null;
    user.next_mess3 = null;
    user.got_mess_changed = false;
    await user.save();

    // Notify user on rejection
    try {
      await sendNotificationToUser(
        user._id,
        "Mess Change Rejected",
        "Your mess change request was not approved this cycle."
      );
    } catch (e) {
      console.log("Failed to send rejection notification", e);
    }
  }
};

/**
 * Update last processed timestamp
 */
const updateLastProcessedTimestamp = async () => {
  try {
    let settings = await MessChangeSettings.findOne();

    if (!settings) {
      settings = new MessChangeSettings({
        isEnabled: false,
        lastProcessedAt: new Date(),
        disabledAt: new Date(),
      });
    } else {
      settings.lastProcessedAt = new Date();
      settings.isEnabled = false;
      settings.disabledAt = new Date();
    }

    await settings.save();
  } catch (error) {
    console.error("Error updating last processed timestamp:", error);
  }
};

// ==========================================
// Controllers
// ==========================================

/**
 * Process all mess change requests
 */
const processAllMessChangeRequests = async (req, res) => {
  try {
    // Step 1: Get all mess change requests FIRST (before resetting)
    // We need to collect this data before resetting users
    const users = await User.find({ applied_for_mess_changed: true });

    if (users.length === 0) {
      return res.status(400).json({ message: "No mess change requests found" });
    }

    // Step 2: Reset all users' mess change status flag
    await User.updateMany({}, { got_mess_changed: false });

    // Step 3: Reset ALL users back to their hostel (regardless of whether they applied)
    // This frees up capacity in their current mess before processing new requests
    await resetAllUsersToHostel();

    // Step 4: Get hostels and initialize capacity tracker AFTER all resets are complete
    // This ensures capacity counts are accurate after resetting users back to their hostels
    const hostels = await Hostel.find({});
    const capacityTracker = await initializeCapacityTracker(hostels);

    // Step 5: Process users using the requests collected in Step 1 with accurate capacity
    const { acceptedUsers, rejectedUsers } = processUsersInIterations(
      users,
      capacityTracker
    );

    // Step 6: Update database for all user categories
    await updateAcceptedUsers(acceptedUsers);
    // Removed reallocateImprovedMessChoices to preserve FCFS fairness
    await updateRejectedUsers(rejectedUsers);

    // Step 7: Automatically disable mess change after processing and update timestamp
    await updateLastProcessedTimestamp();

    sendNotificationMessage(
      "MESS CHANGE",
      "Mess Change is Disabled",
      "All_Hostels",
      { redirectType: "mess_change", isAlert: "true" }
    );

    return res.status(200).json({
      message: `${acceptedUsers.length} requests accepted, ${rejectedUsers.length} rejected. Mess change has been automatically disabled.`,
      acceptedUsers,
      rejectedUsers,
    });
  } catch (error) {
    console.error("Error processing all mess change requests:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Reject all pending mess change requests without processing
 */
const rejectAllMessChangeRequests = async (req, res) => {
  try {
    const users = await User.find({ applied_for_mess_changed: true });
    if (!users || users.length === 0) {
      return res
        .status(400)
        .json({ message: "No pending mess change requests found" });
    }

    for (const user of users) {
      user.applied_for_mess_changed = false;
      user.applied_hostel_string = "";
      user.next_mess = user.curr_subscribed_mess;
      user.got_mess_changed = false;
      user.isWaitlisted = false;
      user.waitlistTimestamp = null;
      await user.save();
    }

    await updateLastProcessedTimestamp();

    sendNotificationMessage(
      "MESS CHANGE",
      "Mess Change is Disabled",
      "All_Hostels",
      { redirectType: "mess_change", isAlert: "true" }
    );

    return res.status(200).json({
      message: `Rejected ${users.length} pending requests. Mess change has been automatically disabled.`,
    });
  } catch (error) {
    console.error("Error rejecting all mess change requests:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  processAllMessChangeRequests,
  rejectAllMessChangeRequests,
  // Export helpers for scheduler use
  resetAllUsersToHostel,
  updateLastProcessedTimestamp,
};
