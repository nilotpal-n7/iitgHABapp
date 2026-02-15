const expess = require("express");

const {
  authenticateJWT,
  authenticateAdminJWT,
} = require("../../middleware/authenticateJWT.js");

const {
  uploadMiddleware,
  applyForLeave,
  getApplications,
  getApplicationByID,
  getApplicationProof,
} = require("./leaveController.js");

const leaveRouter = expess.Router();

leaveRouter.get("/check", (req, res) => {
    if(req) {
        res.send("Leave is running");
    }
});

leaveRouter.post("/apply", authenticateJWT, uploadMiddleware, applyForLeave);

leaveRouter.get("/my-applications", authenticateJWT, getApplications);

leaveRouter.get("/:id", authenticateJWT, getApplicationByID);

leaveRouter.get("/:id/proof", authenticateJWT, getApplicationProof);


module.exports = leaveRouter;
