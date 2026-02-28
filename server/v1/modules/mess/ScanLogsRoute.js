const express = require("express");

const {
  statsByDate,
  getTotalScanLogsCount,
  // createLogs,
  // deleteall
} = require("./ScanLogsController");
const { authenticateHabJWT } = require("../../middleware/authenticateJWT");

const scanLogsRouter = express.Router();

scanLogsRouter.get("/get/:date", authenticateHabJWT, statsByDate);
scanLogsRouter.get("/total", authenticateHabJWT, getTotalScanLogsCount);
// scanLogsRouter.post("/make", createLogs)
// scanLogsRouter.delete("/delete", deleteall)

module.exports = scanLogsRouter;
