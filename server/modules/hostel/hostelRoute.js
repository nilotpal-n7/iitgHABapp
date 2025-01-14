const express = require('express')
const authenticateJWT = require('../../middleware/authenticateJWT.js')

const {
    createHostel,
    getHostel,
    applyMessChange
} = require('./hostelController.js');

const hostelRouter = express.Router();

hostelRouter.post('/', createHostel);

hostelRouter.get('/:hostel_name', getHostel);

hostelRouter.get('/hostel/:hostel_name/user/:roll_number', authenticateJWT, applyMessChange);

module.exports = hostelRouter;