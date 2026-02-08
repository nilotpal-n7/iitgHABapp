const expess = require('express');

const { authenticateJWT } = require('../../middleware/authenticateJWT.js');
const { authenticateAdminJWT } = require('../../middleware/authenticateJWT.js')

const { applyForLeave } = require('./leaveController.js')

const leaveRouter = expess.Router();

leaveRouter.post('/apply', authenticateJWT, applyForLeave)