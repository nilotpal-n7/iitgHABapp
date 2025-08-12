const { User } = require("../user/userModel.js");
const { Hostel } = require("../hostel/hostelModel.js");
const { MessChange } = require("./messChangeModel.js");

const getAllMessChangeRequestsForAllHostels = async (req, res) => {
  try {
    const messChangeRequests = await User.find({
      applied_for_mess_changed: true,
    });
    console.log(messChangeRequests);

    if (!messChangeRequests || messChangeRequests.length === 0) {
      console.log("abc");
      return res.status(404).json({ message: "No mess change requests found" });
    }

    return res.status(200).json({
      message: "Mess change requests fetched successfully",
      data: messChangeRequests,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const processAllMessChangeRequests = async (req, res) => {
  try {
    // Reset got_mess_changed flag for all users at the beginning of a new cycle
    await User.updateMany({}, { got_mess_changed: false });

    // Get all hostels and their capacities
    const hostels = await Hostel.find({});
    const users = await User.find({ applied_for_mess_changed: true });

    if (users.length === 0) {
      return res.status(400).json({ message: "No mess change requests found" });
    }

    // Initialize capacity tracker for each hostel
    const capacityTracker = {};
    for (const hostel of hostels) {
      const currentCount = await User.countDocuments({
        curr_subscribed_mess: hostel._id,
      });
      capacityTracker[hostel._id.toString()] = {
        total: hostel.curr_cap || 0,
        current: currentCount,
        available: (hostel.curr_cap || 0) - currentCount,
      };
    }

    // Separate users into waitlisted and new requests
    const waitlistedUsers = [];
    const newRequests = [];

    for (const user of users) {
      if (user.isWaitlisted) {
        waitlistedUsers.push(user);
      } else {
        newRequests.push(user);
      }
    }

    // Sort waitlisted users by waitlist timestamp (FCFS within waitlist)
    waitlistedUsers.sort((a, b) => a.waitlistTimestamp - b.waitlistTimestamp);

    // Sort new requests by application timestamp (FCFS for new requests)
    newRequests.sort(
      (a, b) => a.applied_hostel_timestamp - b.applied_hostel_timestamp
    );

    const acceptedUsers = [];
    const rejectedUsers = [];
    const finalWaitlistedUsers = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Phase 1: Process waitlisted users first (they get priority)
    for (const user of waitlistedUsers) {
      const result = processUserRequest(
        user,
        capacityTracker,
        acceptedUsers,
        rejectedUsers,
        waitlistedUsers
      );
      if (result === "accepted") {
        acceptedUsers.push(user);
      } else if (result === "waitlisted") {
        waitlistedUsers.push(user);
      } else {
        rejectedUsers.push(user);
      }
    }

    // Phase 2: Process new requests
    for (const user of newRequests) {
      const result = processUserRequest(
        user,
        capacityTracker,
        acceptedUsers,
        rejectedUsers,
        waitlistedUsers
      );
      if (result === "accepted") {
        acceptedUsers.push(user);
      } else if (result === "waitlisted") {
        waitlistedUsers.push(user);
      } else {
        rejectedUsers.push(user);
      }
    }

    // Phase 3: Apply all accepted changes and update user records
    for (const acceptedUser of acceptedUsers) {
      const user = await User.findById(acceptedUser.id);
      if (!user) continue;

      // Apply the mess change
      user.curr_subscribed_mess = acceptedUser.toHostelId;
      user.applied_for_mess_changed = false;
      user.mess_change_button_pressed = false;
      user.got_mess_changed = true;
      user.isWaitlisted = false; // Remove from waitlist
      user.waitlistTimestamp = null;
      await user.save();

      // Get hostel names for the record
      const fromHostel = await Hostel.findById(acceptedUser.fromHostelId);
      const toHostel = await Hostel.findById(acceptedUser.toHostelId);

      // Create mess change record
      const messChangeRecord = new MessChange({
        userName: user.name,
        fromHostel: fromHostel ? fromHostel.hostel_name : "Unknown",
        toHostel: toHostel ? toHostel.hostel_name : "Unknown",
        year: currentYear,
        month: currentMonth,
      });
      await messChangeRecord.save();

      // Update the accepted user object with hostel names
      acceptedUser.fromHostel = fromHostel ? fromHostel.hostel_name : "Unknown";
      acceptedUser.toHostel = toHostel ? toHostel.hostel_name : "Unknown";
    }

    // Phase 4: Update rejected users
    for (const rejectedUser of rejectedUsers) {
      const user = await User.findById(rejectedUser.id);
      if (!user) continue;

      user.applied_for_mess_changed = false;
      user.mess_change_button_pressed = false;
      user.applied_hostel_string = "";
      user.next_mess = user.curr_subscribed_mess;
      user.got_mess_changed = false;
      await user.save();
    }

    // Phase 5: Update waitlisted users
    for (const waitlistedUser of waitlistedUsers) {
      const user = await User.findById(waitlistedUser.id);
      if (!user) continue;

      // Keep them in the system but mark as waitlisted
      user.isWaitlisted = true;
      user.waitlistTimestamp = user.waitlistTimestamp || Date.now();
      await user.save();
    }

    return res.status(200).json({
      message: `${acceptedUsers.length} requests accepted, ${rejectedUsers.length} rejected, ${waitlistedUsers.length} waitlisted.`,
      acceptedUsers,
      rejectedUsers,
      waitlistedUsers,
    });
  } catch (error) {
    console.error("Error processing all mess change requests:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Helper function to process individual user requests
const processUserRequest = (
  user,
  capacityTracker,
  acceptedUsers,
  rejectedUsers,
  waitlistedUsers
) => {
  const targetHostelId = user.next_mess;
  const currentHostelId = user.curr_subscribed_mess;

  if (!targetHostelId || !currentHostelId) {
    return "rejected";
  }

  const target = capacityTracker[targetHostelId.toString()];

  if (!target) {
    return "rejected";
  }

  // Check if we can accept this user
  if (target.available > 0) {
    // Accept the request
    acceptedUsers.push({
      id: user._id,
      name: user.name,
      rollNumber: user.rollNumber,
      fromHostelId: currentHostelId,
      toHostelId: targetHostelId,
    });

    // Update available capacity
    target.available--;
    target.current++;

    return "accepted";
  } else {
    // Check if user should be waitlisted or rejected
    // Waitlist if they're not already waitlisted and it's a reasonable request
    if (!user.isWaitlisted && shouldWaitlist(user, target)) {
      waitlistedUsers.push({
        id: user._id,
        name: user.name,
        rollNumber: user.rollNumber,
        fromHostelId: currentHostelId,
        toHostelId: targetHostelId,
      });
      return "waitlisted";
    } else {
      rejectedUsers.push({
        id: user._id,
        name: user.name,
        rollNumber: user.rollNumber,
      });
      return "rejected";
    }
  }
};

// Helper function to determine if a user should be waitlisted
const shouldWaitlist = (user, targetHostel) => {
  // Simple logic: waitlist if the hostel is popular (high demand)
  // You can customize this logic based on your requirements
  const waitlistThreshold = Math.floor(targetHostel.total * 0.1); // 10% of capacity

  // Check if there are already many waitlisted users
  // This prevents infinite waitlisting
  return true; // For now, always allow waitlisting
};

const getAcceptedStudentsByHostel = async (req, res) => {
  try {
    const { hostelName } = req.params;

    if (!hostelName) {
      return res.status(400).json({ message: "Hostel name is required" });
    }

    const acceptedStudents = await MessChange.find({
      toHostel: hostelName,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      message: "Accepted students fetched successfully",
      data: acceptedStudents,
    });
  } catch (error) {
    console.error("Error fetching accepted students:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const messChangeRequest = async (req, res) => {
  try {
    const user = req.user;
    const { mess_pref } = req.body;
    if (!req.user) {
      return res.status(404).json({ message: "User not Found" });
    }

    const next_hostel = await Hostel.findOne({ hostel_name: mess_pref });
    if (!next_hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    user.applied_for_mess_changed = true;
    user.applied_hostel_string = mess_pref;
    user.applied_hostel_timestamp = Date.now();
    user.next_mess = next_hostel._id; // Set to hostel ID, not mess ID
    user.isWaitlisted = false; // New request, not waitlisted yet
    user.waitlistTimestamp = null;
    await user.save();

    res.status(200).json({ message: "Request Sent" });
  } catch (e) {
    console.log(`Error: ${e}`);
    res.status(500).json("Internal Server Error");
  }
};

// GET user's mess change status
const messChangeStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "Not Authenticated" });
    }

    const user = req.user;

    return res.status(200).json({
      message: "User mess change status fetched successfully",
      applied: user.applied_for_mess_changed || false,
      hostel: user.applied_hostel_string || "",
      default: user.hostel || "",
      isWaitlisted: user.isWaitlisted || false,
      waitlistPosition: user.waitlistPosition || null,
    });
  } catch (err) {
    console.error("Error in messChangeStatus:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllMessChangeRequestsForAllHostels,
  processAllMessChangeRequests,
  getAcceptedStudentsByHostel,
  messChangeRequest,
  messChangeStatus,
};
