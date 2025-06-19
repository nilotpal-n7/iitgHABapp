const express = require("express");
const {
  authenticateJWT,
  authenticateAdminJWT,
} = require("../../middleware/authenticateJWT.js");

const {
  createHostel,
  deleteHostel,
  getHostel,
  getHostelbyId,
  applyMessChange,
  getAllHostelNameAndCaterer
} = require("./hostelController.js");

const hostelRouter = express.Router();

hostelRouter.post("/", createHostel);

hostelRouter.post("/all/:hostelId",getHostelbyId);
hostelRouter.delete("/delete/:hostelId",deleteHostel);

hostelRouter.get('/:hostel_name', getHostel);

hostelRouter.post("/change", authenticateJWT, applyMessChange);

//Route to get only hostel and caterer information
hostelRouter.post("/gethnc",getAllHostelNameAndCaterer);
module.exports = hostelRouter;
