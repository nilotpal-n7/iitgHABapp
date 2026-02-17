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
  getAllPendingApplications,
  filterApplications,
  approveApplication,
  rejectApplication,
  getRebateSummary,
} = require("./leaveController.js");

const leaveRouter = express.Router();

leaveRouter.get("/check", (req, res) => {
    if(req) {
        res.send("Leave is running");
    }
});

//User/Student Endpoint
leaveRouter.use('/files', express.static(path.join(__dirname, 'uploads')));

leaveRouter.post('/apply', authenticateJWT, uploadMiddleware, applyForLeave);

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
