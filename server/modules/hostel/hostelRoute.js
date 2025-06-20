const express = require("express");
const {
  authenticateJWT,
  authenticateAdminJWT,
} = require("../../middleware/authenticateJWT.js");

const {
  createHostel,
  loginHostel,
  getHostel,
  getAllHostels,
  applyMessChange,
  getAllHostelsWithMess,
} = require("./hostelController.js");

const hostelRouter = express.Router();

hostelRouter.post("/", createHostel);

hostelRouter.post("/login", loginHostel);

hostelRouter.get("/get", authenticateAdminJWT, getHostel);

hostelRouter.get("/all", getAllHostels);

hostelRouter.get("/allhostel", getAllHostelsWithMess);

hostelRouter.post("/change", authenticateJWT, applyMessChange);

module.exports = hostelRouter;
