const express = require("express");
const authenticateJWT = require("../../middleware/authenticateJWT.js");

const {
  createMess,
  deleteMess,
  deleteMenu,
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
messRouter.delete("/delete/:messId", deleteMess);
messRouter.post("/menu/create", createMenu);
messRouter.delete("/menu/delete/:menuId", deleteMenu);
messRouter.post("/menu/item/create", createMenuItem);
messRouter.delete("/menu/item/delete/:menuItemId", deleteMenuItem);
messRouter.post("/get", authenticateJWT, getUserMessInfo);
messRouter.post("/all", getAllMessInfo);
messRouter.post("/menu/:messId", authenticateJWT, getMessMenuByDay);
messRouter.post("/menu/item/:menuItemId", authenticateJWT, getMessMenuItemById);
messRouter.post(
  "/menu/item/like/:menuItemId",
  authenticateJWT,
  toggleLikeMenuItem
);
messRouter.post("/scan/:messId",authenticateJWT, ScanMess);

module.exports = messRouter;
