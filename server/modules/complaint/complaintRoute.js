const express = require('express');

const complaintRouter = express.Router();

const authenticateJWT = require('../../middleware/authenticateJWT');

const { submitComplaint, updateComplaint } = require('./complaintController');

complaintRouter.post('/', authenticateJWT, submitComplaint);

complaintRouter.put('/:id', authenticateJWT, updateComplaint);

module.exports = complaintRouter;