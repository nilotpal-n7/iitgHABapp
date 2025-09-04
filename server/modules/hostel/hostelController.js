const { User } = require("../user/userModel.js");
const { Hostel } = require("./hostelModel.js");
const { Mess } = require("../mess/messModel.js");
const UserAllocHostel = require("./hostelAllocModel.js");

const createHostel = async (req, res) => {
  try {
    const { hostel_name, password, curr_cap } = req.body;
    const hostel = await Hostel.create({
      hostel_name,
      password,
      curr_cap,
    });

    return res
      .status(201)
      .json({ message: "Hostel created successfully", hostel });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error occurred" });
  }
};

const loginHostel = async (req, res) => {
  const { hostel_name, password } = req.body;
  try {
    const hostel = await Hostel.findOne({ hostel_name }).populate("messId");
    if (!hostel) return res.status(400).json({ message: "No such hostel" });

    const verify = await hostel.verifyPassword(password);
    if (!verify) return res.status(401).json({ message: "Incorrect password" });

    const token = hostel.generateJWT();
    //console.log("Generated tokenin cont:", token);
    return res.status(201).json({
      message: "Logged in successfully",
      token,
      hostel,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error occurred" });
  }
};

const getHostel = async (req, res) => {
  try {
    // Fetch the hostel with populated messId
    const hostel = await Hostel.findById(req.hostel._id).populate("messId");
    return res.json({ hostel });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error occurred" });
  }
};

const getAllHostels = async (req, res) => {
  try {
    const hostels = await Hostel.find();
    return res.status(200).json(hostels);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error occured" });
  }
};

const getAllHostelsWithMess = async (req, res) => {
  try {
    const hostels = await Hostel.find().populate("messId");
    return res.status(200).json(hostels);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error occurred" });
  }
};

const getHostelbyId = async (req, res) => {
  const { hostelId } = req.params;
  try {
    const hostel = await Hostel.findById(hostelId).populate("messId", "name");

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    // Fetch users associated with this hostel
    const users = await User.find({ hostel: hostelId }).select(
      "name rollNumber email degree curr_subscribed_mess"
    );
    console.log(`Found ${users.length} users for hostel ${hostelId}:`, users);

    // Fetch all hostels with their mess information to map curr_subscribed_mess
    const hostelsWithMess = await Hostel.find().populate("messId", "name");
    console.log("All hostels with mess mapping:", hostelsWithMess);

    // Format users to match the expected structure (with user wrapper)
    const formattedUsers = users.map((user) => ({
      user: {
        _id: user._id,
        name: user.name,
        rollNumber: user.rollNumber,
        email: user.email,
        degree: user.degree,
        curr_subscribed_mess_name: (() => {
          if (!user.curr_subscribed_mess) return "N/A";
          const subscribedHostel = hostelsWithMess.find(
            (h) => h._id.toString() === user.curr_subscribed_mess.toString()
          );
          return subscribedHostel?.hostel_name || "N/A";
        })(),
      },
    }));
    console.log("Formatted users:", formattedUsers);
    const hostelWithUsers = {
      ...hostel.toObject(),
      users: formattedUsers,
    };

    return res
      .status(200)
      .json({ message: "Hostel found", hostel: hostelWithUsers });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error occurred" });
  }
};

const deleteHostel = async (req, res) => {
  try {
    const hostelId = req.params.hostelId;
    const deletedHostel = await Hostel.findByIdAndDelete(hostelId);
    if (!deletedHostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }
    return res.status(200).json({ message: "Hostel deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllHostelNameAndCaterer = async (req, res) => {
  try {
    const hostelData = await Hostel.find(
      {},
      { hostel_name: 1, messId: 1 }
    ).populate({
      path: "messId",
      select: "name -_id",
    });

    // Get user count for each hostel
    const hostelDataWithUserCount = await Promise.all(
      hostelData.map(async (hostel) => {
        const userCount = await User.countDocuments({ hostel: hostel._id });
        return {
          ...hostel.toObject(),
          user_count: userCount,
        };
      })
    );

    res.status(200).json(hostelDataWithUserCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createHostel,
  loginHostel,
  getHostel,
  getAllHostels,
  getAllHostelsWithMess,
  getHostelbyId,
  deleteHostel,
  getAllHostelNameAndCaterer,
};
