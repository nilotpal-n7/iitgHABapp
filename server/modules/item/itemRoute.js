const express = require('express');

const { getComplaintsOfItemsByHostel, createItem, deleteItem, updateItem, getItems, getItem } = require('./itemController');

const itemRouter = express.Router();

itemRouter.get('/complaints/:hostel', getComplaintsOfItemsByHostel);

itemRouter.post('/', createItem);

itemRouter.delete('/:id', deleteItem);

itemRouter.put('/:id', updateItem);

itemRouter.get('/', getItems);

itemRouter.get('/:id', getItem);

module.exports = itemRouter;