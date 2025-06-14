const express = require("express");
const authenticateJWT = require("../../middleware/authenticateJWT.js");

const {
  createHostel,
  getHostel,
  getAllHostels,
  applyMessChange,
} = require("./hostelController.js");

const hostelRouter = express.Router();

hostelRouter.post("/", createHostel);

// hostelRouter.get('/:hostel_name', getHostel);

hostelRouter.get('/all', getAllHostels);

hostelRouter.post("/change", authenticateJWT, applyMessChange);

module.exports = hostelRouter;
