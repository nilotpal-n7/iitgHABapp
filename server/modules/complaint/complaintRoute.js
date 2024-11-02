const express = require('express');

const complaintRouter = express.Router();

const authenticateJWT = require('../../middleware/authenticateJWT');

const { submitComplaint, updateComplaint, getComplaint } = require('./complaintController');

complaintRouter.post('/', authenticateJWT, submitComplaint);

complaintRouter.put('/:id', authenticateJWT, updateComplaint);

complaintRouter.get('/:id', getComplaint);

module.exports = complaintRouter;