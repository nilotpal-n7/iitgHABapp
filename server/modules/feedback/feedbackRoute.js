// routes/feedbackRoutes.js

const express = require("express");
const feedbackRouter = express.Router();
<<<<<<< HEAD
const { submitFeedback ,removeFeedback, downloadFeedbackSheet, removeAllFeedbacks} = require('./feedbackController');
const { authenticateJWT } = require('../../middleware/authenticateJWT');
=======
const {
  submitFeedback,
  removeFeedback,
  downloadFeedbackSheet,
  removeAllFeedbacks,
} = require("./feedbackController");
const { authenticateJWT } = require("../../middleware/authenticateJWT");
>>>>>>> 01a3e615c63fef5c50d01c60cb5624d57ac6dca8

// Route to generate and download the feedback report
feedbackRouter.post("/submit", submitFeedback);
feedbackRouter.post("/remove", removeFeedback);

// GET Excel file of all feedback for testing
//feedbackRouter.get('/download', downloadFeedbackSheet);

//feedbackRouter.delete('/removeAll', removeAllFeedbacks);

module.exports = feedbackRouter;
