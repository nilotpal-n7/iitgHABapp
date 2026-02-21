const express = require("express");

const {
  authenticateJWT,
  authenticateAdminJWT,
} = require("../../middleware/authenticateJWT.js");

const { uploadToOnedrive } = require('./uploadToOnedrive.js')

const {
  uploadMiddleware,
  applyForLeave,
  getApplications,
  getApplicationByID,
  getApplicationProof,
  getAllPendingApplications,
  filterApplications,
  approveApplication,
  rejectApplication,
  getRebateSummary,
  validateApply
} = require("./leaveController.js");

const leaveRouter = express.Router();

leaveRouter.get("/check", (req, res) => {
    if(req) {
        res.send("Leave is running");
    }
});

//User/Student Endpoint

leaveRouter.post('/apply', authenticateJWT, uploadMiddleware, validateApply, uploadToOnedrive, applyForLeave);

leaveRouter.get('/my-applications', authenticateJWT, getApplications);

leaveRouter.get('/:id', authenticateJWT, getApplicationByID);

leaveRouter.get('/:id/proof', authenticateJWT, getApplicationProof);


//Hostel Office Endpoints
leaveRouter.get('/hostel/pending', authenticateAdminJWT, getAllPendingApplications);

leaveRouter.get('/hostel/all', authenticateAdminJWT, filterApplications);

leaveRouter.post('/:id/approve', authenticateAdminJWT, approveApplication);

leaveRouter.post('/:id/reject', authenticateAdminJWT, rejectApplication);

leaveRouter.get('/hostel/rebate-summary', authenticateAdminJWT, getRebateSummary);

module.exports = leaveRouter;
