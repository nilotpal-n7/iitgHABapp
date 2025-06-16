const express = require("express");
const authenticateJWT = require("../../middleware/authenticateJWT.js");

const {
  createHostel,
  getHostel,
  applyMessChange,
  getAllHostelNameAndCaterer
} = require("./hostelController.js");

const hostelRouter = express.Router();

hostelRouter.post("/", createHostel);

// hostelRouter.get('/:hostel_name', getHostel);

hostelRouter.post("/change", authenticateJWT, applyMessChange);

//Route to get only hostel and caterer information
hostelRouter.get("/gethnc",getAllHostelNameAndCaterer)
module.exports = hostelRouter;
