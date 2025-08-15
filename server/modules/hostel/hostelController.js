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
  // console.log("xyz", req.hostel);
  return res.json({ hostel: req.hostel });
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

    return res.status(200).json({ message: "Hostel found", hostel });
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

    res.status(200).json(hostelData);
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
