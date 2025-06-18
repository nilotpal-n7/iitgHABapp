const express = require("express");
const authenticateJWT = require("../../middleware/authenticateJWT.js");

const {
  createHostel,
  deleteHostel,
  getHostel,
  applyMessChange,
} = require("./hostelController.js");

const hostelRouter = express.Router();

hostelRouter.post("/", createHostel);
hostelRouter.delete("/delete/:hostelId",deleteHostel);

hostelRouter.get('/:hostel_name', getHostel);

hostelRouter.post("/change", authenticateJWT, applyMessChange);

module.exports = hostelRouter;
