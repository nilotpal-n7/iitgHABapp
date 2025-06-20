const express = require("express");

const complaintRouter = express.Router();

<<<<<<< HEAD
const { authenticateJWT } = require('../../middleware/authenticateJWT');
=======
const { authenticateJWT } = require("../../middleware/authenticateJWT");
>>>>>>> 01a3e615c63fef5c50d01c60cb5624d57ac6dca8

const {
  submitComplaint,
  updateComplaint,
  getComplaint,
  deleteComplaint,
} = require("./complaintController");

complaintRouter.post("/", authenticateJWT, submitComplaint);

complaintRouter.put("/:id", authenticateJWT, updateComplaint);

complaintRouter.get("/:id", authenticateJWT, getComplaint);

complaintRouter.delete("/:id", authenticateJWT, deleteComplaint);

module.exports = complaintRouter;
