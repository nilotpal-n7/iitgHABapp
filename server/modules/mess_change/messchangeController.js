const { User } = require("../user/userModel.js");
const { Hostel } = require("../hostel/hostelModel.js");

const getAllMessChangeRequests = async (req, res) => {
  const hostel = req.hostel;
  const hostelId = hostel.messId;

  try {
    const messChangeRequests = await User.find({
      next_mess: hostelId,
      applied_for_mess_changed: true,
    }).sort({ applied_hostel_timestamp: 1 });

    if (!messChangeRequests || messChangeRequests.length === 0) {
      return res
        .status(404)
        .json({ message: "No mess change requests found for this hostel" });
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

const getAllMessChangeRequestsForAllMess = async (req, res) => {
  try {
    const messChangeRequests = await User.find({
      applied_for_mess_changed: true,
    });

    if (!messChangeRequests || messChangeRequests.length === 0) {
      return res
        .status(404)
        .json({ message: "No mess change requests found for this hostel" });
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

const acceptAndRejectByFCFS = async (req, res) => {
  try {
    const { hostelId } = req.params;

    // Fetch the hostel to get capacity
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    const capacity = hostel.capacity;

    // Count how many users are already subscribed to this mess
    const currentCount = await User.countDocuments({
      curr_subscribed_mess: hostelId,
    });

    const availableSlots = capacity - currentCount;

    if (availableSlots <= 0) {
      return res.status(400).json({ message: "Mess is already full." });
    }

    // Fetch all requests for this hostel, sorted by FCFS
    const allRequests = await User.find({
      next_mess: hostelId,
      applied_for_mess_changed: true,
    }).sort({ applied_hostel_timestamp: 1 });

    const acceptedUsers = [];
    const rejectedUsers = [];

    for (let i = 0; i < allRequests.length; i++) {
      const user = allRequests[i];

      if (i < availableSlots) {
        // Accept the request
        user.curr_subscribed_mess = user.next_mess;
        user.applied_for_mess_changed = false;
        user.got_mess_changed = true;
        user.mess_change_button_pressed = false;
        await user.save();

        acceptedUsers.push({
          id: user._id,
          name: user.name,
          rollNumber: user.rollNumber,
        });
      } else {
        // Reject the request
        user.applied_for_mess_changed = false;
        user.mess_change_button_pressed = false;
        user.applied_hostel_string = "";
        user.next_mess = user.curr_subscribed_mess;
        await user.save();

        rejectedUsers.push({
          id: user._id,
          name: user.name,
          rollNumber: user.rollNumber,
        });
      }
    }

    return res.status(200).json({
      message: `${acceptedUsers.length} requests accepted, ${rejectedUsers.length} rejected.`,
      acceptedUsers,
      rejectedUsers,
    });
  } catch (error) {
    console.error("Error processing mess change requests:", error);
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
    const next_mess = next_hostel.messId;

    user.applied_for_mess_changed = true;
    user.applied_hostel_string = mess_pref;
    user.applied_hostel_timestamp = Date.now();
    user.next_mess = next_mess;
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
    });
  } catch (err) {
    console.error("Error in messChangeStatus:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllMessChangeRequests,
  getAllMessChangeRequestsForAllMess,
  acceptAndRejectByFCFS,
  messChangeRequest,
  messChangeStatus,
};
