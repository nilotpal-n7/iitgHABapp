const express = require("express");
const {authenticateJWT} = require("../../middleware/authenticateJWT.js");

const {
  getComplaintsOfItemsByHostel,
  createItem,
  deleteItem,
  updateItem,
  getItems,
  // eslint-disable-next-line no-unused-vars
  getItem,
  // eslint-disable-next-line no-unused-vars
  getItemsWithComplaints,
  // eslint-disable-next-line no-unused-vars
  getItemsForHAB,
  // eslint-disable-next-line no-unused-vars
  resolveItem,
  // eslint-disable-next-line no-unused-vars
  inProgressItem,
} = require("./itemController");

const itemRouter = express.Router();

itemRouter.get(
  "/complaints/:hostel",
  authenticateJWT,
  getComplaintsOfItemsByHostel
);

itemRouter.post("/", authenticateJWT, createItem);

itemRouter.delete("/:id", authenticateJWT, deleteItem);

itemRouter.put("/:id", authenticateJWT, updateItem);

itemRouter.get("/", authenticateJWT, getItems);

// itemRouter.get('/:qr', getItem);

// itemRouter.get('/hostelcomplaints/:hostel', getItemsWithComplaints);

// itemRouter.get('/hab/:hostel', getItemsForHAB);

// itemRouter.get('/resolve/:itemId', resolveItem);

// itemRouter.get('/inprogress/:itemId', inProgressItem);

module.exports = itemRouter;
