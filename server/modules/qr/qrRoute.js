<<<<<<< HEAD
const express = require('express');
const {authenticateJWT} = require('../../middleware/authenticateJWT.js');
=======
const express = require("express");
const { authenticateJWT } = require("../../middleware/authenticateJWT.js");
>>>>>>> 01a3e615c63fef5c50d01c60cb5624d57ac6dca8

const { createQR, checkScanned } = require("./qrController.js");

const qrRouter = express.Router();

qrRouter.put("/check", checkScanned);

qrRouter.post("/", createQR);

module.exports = qrRouter;
