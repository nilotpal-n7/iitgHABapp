const express = require("express");
const {authenticateJWT} = require("../../middleware/authenticateJWT.js");

const {
  createMess,
  createMenu,
  createMenuItem,
  deleteMenuItem,
  getUserMessInfo,
  getAllMessInfo,
  getMessInfo,
  getMessMenuByDay,
  getMessMenuItemById,
  toggleLikeMenuItem,
  ScanMess,
} = require("./messController");

const messRouter = express.Router();

messRouter.post("/create", createMess);
messRouter.post("/menu/create", createMenu);
messRouter.post("/menu/item/create", createMenuItem);
messRouter.delete("/menu/item/delete/:menuItemId", deleteMenuItem);
messRouter.post("/get", authenticateJWT, getUserMessInfo);
messRouter.post("/all", getAllMessInfo);
messRouter.get("/:id", getMessInfo);
messRouter.post("/menu/:messId", authenticateJWT, getMessMenuByDay);
messRouter.post("/menu/item/:menuItemId", authenticateJWT, getMessMenuItemById);
messRouter.post(
  "/menu/item/like/:menuItemId",
  authenticateJWT,
  toggleLikeMenuItem
);
messRouter.post("/scan/:messId",authenticateJWT, ScanMess);

module.exports = messRouter;
