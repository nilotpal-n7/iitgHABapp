const { Hostel } = require("../hostel/hostelModel.js");
const { User } = require("../user/userModel.js");

const getAllMessChangeRequests = async (req, res) => {
const { hostelId } = req.params;

  try {
    const hostel = await Hostel.findById(hostelId)
      .populate("users.user", "name rollNumber degree");

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    const messChangeRequests = hostel.users.map((entry) => ({
      userId: entry.user._id,
      name: entry.user.name,
      rollNumber: entry.user.rollNumber,
      degree: entry.user.degree,
      reason: entry.reason_for_change || null,
    }));

    return res.status(200).json({
      message: "Mess change requests fetched successfully",
      data: messChangeRequests,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
} 


   const getAllMessChangeRequestsForAllMess = async (req, res) => {
  try {
    
    const hostels = await Hostel.find({})
      .populate("users.user", "name rollNumber degree applied_for_mess_changed");

    const allRequests = [];

    hostels.forEach((hostel) => {
      hostel.users.forEach((entry) => {
        if (entry.user && entry.user.applied_for_mess_changed === true) {
          allRequests.push({
            userId: entry.user._id,
            name: entry.user.name,
            rollNumber: entry.user.rollNumber,
            degree: entry.user.degree,
            reason: entry.reason_for_change || null,
            currentMess: entry.user.curr_subscribed_mess,
            appliedToMess: entry.user.next_mess || null,
            gotMessChanged : entry.user.got_mess_changed,
          });
        }
      });
    });

    return res.status(200).json({
      message: "Filtered mess change requests fetched successfully",
      data: allRequests,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const acceptMessChangeRequest = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    //Update user's mess details
    user.curr_subscribed_mess = user.next_mess;
    user.applied_for_mess_changed = false;
    user.got_mess_changed = true;
    user.mess_change_button_pressed = false;
    await user.save();

    //Remove user's mess change request entry from their current hostel
    await Hostel.updateOne(
      { _id: user.hostel },
      { $pull: { users: { user: user._id } } }
    );

    return res.status(200).json({ message: "Mess change request accepted" });
  } catch (error) {
    console.error("Error accepting mess change request:", error);
    return res.status(500).json({ message: "Server error" });
  }
};




const rejectMessChangeRequest = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Reset mess change-related fields
    user.applied_for_mess_changed = false;
    user.mess_change_button_pressed = false;
    user.applied_hostel_string = "";
    user.next_mess = user.curr_subscribed_mess; // Reset to current mess
    await user.save();

    // Remove user's request from current hostel's users list
    await Hostel.updateOne(
      { _id: user.hostel },
      { $pull: { users: { user: user._id } } }
    );

    return res.status(200).json({ message: "Mess change request rejected" });
  } catch (error) {
    console.error("Error rejecting mess change request:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const messChangeRequest = async (req,res) => {
  const { hostel_name, roll_number, reason } = req.body;
  const today = new Date();
  const dayOfMonth = today.getDate();

  if (dayOfMonth < 24 || dayOfMonth > 27) {
    return res.status(403).json({
      message:
        "Mess change requests only allowed between 24th and 27th of a month",
    });
  }

  try {
    const hostel = await Hostel.findOne({ hostel_name });
    const user = await User.findOne({ rollNumber: roll_number });

    user.applied_hostel_string = hostel_name;
    user.mess_change_button_pressed = true;

    if (
      hostel &&
      hostel._id.toString() !== user.hostel.toString() &&
      hostel.curr_cap < 150 &&
      !user.applied_for_mess_changed
    ) {
      const userCurrMess = await Hostel.findById(user.curr_subscribed_mess);

      hostel.curr_cap += 1;
      user.next_mess = hostel._id;
      user.applied_for_mess_changed = true;

      userCurrMess.users.pull({ user: user._id });
      hostel.users.push({ user: user._id, reason_for_change: reason });

      await user.save();
      await hostel.save();
      await userCurrMess.save();

      return res.status(200).json({
        message: "Mess change request proceeded",
        status_code: 0,
      });
    } else {
      await user.save();
      return res.status(200).json({
        message:
          "Sorry, the capacity has been reached or you have already applied or you're applying for the same hostel",
        status_code: 1,
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error occurred" });
  }
}

module.exports = {
  getAllMessChangeRequests,
  getAllMessChangeRequestsForAllMess,
  acceptMessChangeRequest,
  rejectMessChangeRequest,
  messChangeRequest
};

