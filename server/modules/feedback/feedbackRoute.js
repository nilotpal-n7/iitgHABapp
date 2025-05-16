// routes/feedbackRoutes.js

const express = require('express');
const feedbackRouter = express.Router();
const { submitFeedback , downloadFeedbackSheet} = require('./feedbackController');
const authenticateJWT = require('../../middleware/authenticateJWT');

// Route to generate and download the feedback report
feedbackRouter.post('/submit', authenticateJWT, submitFeedback);

// GET Excel file of all feedback
//feedbackRouter.get('/download', downloadFeedbackSheet);

module.exports = feedbackRouter;
