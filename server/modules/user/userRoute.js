const express = require('express')
const authenticateJWT = require('../../middleware/authenticateJWT.js')

const { getUserData, createUser, deleteUser, updateUser, getUserComplaints } = require('./userController.js');

const userRouter = express.Router();

userRouter.post('/', createUser);

userRouter.get('/', authenticateJWT, getUserData);

userRouter.delete('/:outlook', authenticateJWT, deleteUser);

userRouter.put('/:outlook', authenticateJWT, updateUser);

userRouter.get('/complaints/:outlook', authenticateJWT, getUserComplaints);

module.exports = userRouter;

