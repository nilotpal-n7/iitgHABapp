const express = require("express");
const authenticateJWT = require("../../middleware/authenticateJWT.js");

const {
  createMess,
  createMenu,
  createMenuItem,
  deleteMenuItem,
  getUserMessInfo,
  getAllMessInfo,
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
messRouter.get("/get", authenticateJWT, getUserMessInfo);
messRouter.get("/all", authenticateJWT, getAllMessInfo);
messRouter.get("/menu/:messId", authenticateJWT, getMessMenuByDay);
messRouter.get("/menu/item/:menuItemId", authenticateJWT, getMessMenuItemById);
messRouter.post(
  "/menu/item/like/:menuItemId",
  authenticateJWT,
  toggleLikeMenuItem
);
messRouter.post("/scan", authenticateJWT, ScanMess);

module.exports = messRouter;
