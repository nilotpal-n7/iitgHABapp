//const axios =require("axios");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const { adminjwtsecret } = require("../../config/default.js");

dotenv.config();
// Added comment 32

/**
 * @swagger
 * components:
 *   schemas:
 *     UserTimeStamp:
 *       type: object
 *       required:
 *         - user
 *       properties:
 *         user:
 *           type: string
 *           description: Reference to User ObjectId
 *           example: "64a1b2c3d4e5f6789012345"
 *         reason_for_change:
 *           type: string
 *           description: Reason for hostel change
 *           default: ""
 *           example: "Academic requirements"
 *
 *     Hostel:
 *       type: object
 *       required:
 *         - hostel_name
 *         - users
 *         - curr_cap
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the hostel
 *           example: "64a1b2c3d4e5f6789012346"
 *         hostel_name:
 *           type: string
 *           description: Name of the hostel
 *           example: "Kameng Hostel"
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserTimeStamp'
 *           description: Array of users in this hostel
 *           default: []
 *           example: [
 *             {
 *               "user": "64a1b2c3d4e5f6789012345",
 *               "reason_for_change": "Academic requirements"
 *             }
 *           ]
 *         messId:
 *           type: string
 *           description: Reference to Mess ObjectId
 *           example: "64a1b2c3d4e5f6789012347"
 *         curr_cap:
 *           type: number
 *           description: Current capacity/number of users in hostel
 *           default: 0
 *           example: 150
 *         password:
 *           type: string
 *           format: password
 *           description: Hashed password for hostel authentication
 *           example: "$2b$10$N9qo8uLOickgx2ZMRZoMye..."
 */

const hostelSchema = new mongoose.Schema({
  hostel_name: {
    type: String,
    required: true,
    unique: true,
  },
  messId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Mess",
  },
  curr_cap: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

hostelSchema.pre("save", async function (next) {
  // Hash password before saving
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

hostelSchema.methods.verifyPassword = function (givenPassword) {
  return bcrypt.compare(givenPassword, this.password);
};

hostelSchema.methods.generateJWT = function () {
  let hostel = this;
  //console.log("jwtsec", adminjwtsecret);
  let token = jwt.sign({ hostel: hostel._id }, adminjwtsecret, {
    expiresIn: "2h",
  });

  console.log("Generated token:", token);
  console.log(token.length);
  return token;
};

hostelSchema.statics.findByJWT = async function (token) {
  try {
    console.log("Verifying token:", token);
    console.log(token.length);
    let hostel = this;
    console.log("Verifying token with secret:", adminjwtsecret);
    var decoded = jwt.verify(token, adminjwtsecret);
    //console.log("Decoded token:", decoded);
    const id = decoded.hostel;
    console.log("Decoded hostel ID:", id);
    const fetchedHostel = await hostel.findOne({ _id: id }).populate("messId");
    if (!fetchedHostel) return false;
    return fetchedHostel;
  } catch (error) {
    console.error("Error verifying token:", error);
    return false;
  }
};

const Hostel = mongoose.model("Hostel", hostelSchema);

module.exports = { Hostel };
