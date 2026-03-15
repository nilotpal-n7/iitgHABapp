const express = require("express");
const { getStatus, scan } = require("./laundryController.js");
const { authenticateJWT } = require("../../middleware/authenticateJWT.js");

const laundryRouter = express.Router();

laundryRouter.get("/status", authenticateJWT, getStatus);
laundryRouter.post("/scan", authenticateJWT, scan);

module.exports = laundryRouter;
