const express = require("express");
const {
  authenticateJWT,
  authenticateAdminJWT,
} = require("../../middleware/authenticateJWT.js");

const {
  createHostel,
  loginHostel,
  getHostel,
  getHostelbyId,
  getAllHostels,
  applyMessChange,
  getAllHostelNameAndCaterer
} = require("./hostelController.js");

const hostelRouter = express.Router();

hostelRouter.post("/", createHostel);

hostelRouter.get("/all/:hostelId",getHostelbyId);

hostelRouter.get("/all/:hostelId",getHostelbyId);

hostelRouter.post("/login", authenticateAdminJWT, loginHostel);

hostelRouter.get("/get", authenticateAdminJWT, getHostel);

hostelRouter.get("/all", getAllHostels);

hostelRouter.post("/change", authenticateJWT, applyMessChange);

//Route to get only hostel and caterer information
hostelRouter.get("/gethnc",getAllHostelNameAndCaterer)
module.exports = hostelRouter;
