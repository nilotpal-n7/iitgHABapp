const express = require('express')

const { getUserData, createUser, deleteUser, updateUser, getUserComplaints } = require('./userController.js');

const userRouter = express.Router();

userRouter.get('/:outlook', getUserData);

userRouter.post('/', createUser);

userRouter.delete('/:outlook', deleteUser);

userRouter.put('/:outlook', updateUser);

userRouter.get('/complaints/:outlook', getUserComplaints);

module.exports = userRouter;

