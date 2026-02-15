const express = require("express");
const path = require("path");

const {
  authenticateJWT,
  authenticateAdminJWT,
} = require("../../middleware/authenticateJWT.js");

const {
  uploadMiddleware,
  applyForLeave,
  getApplications,
  getApplicationByID,
  getApplicationProof,
} = require("./leaveController.js");

const leaveRouter = express.Router();

leaveRouter.get("/check", (req, res) => {
    if(req) {
        res.send("Leave is running");
    }
});

leaveRouter.use('/files', express.static(path.join(__dirname, 'uploads')));

leaveRouter.post("/apply", authenticateJWT, uploadMiddleware, applyForLeave);

leaveRouter.get("/my-applications", authenticateJWT, getApplications);

leaveRouter.get("/:id", authenticateJWT, getApplicationByID);

leaveRouter.get("/:id/proof", authenticateJWT, getApplicationProof);


module.exports = leaveRouter;
