const schedule = require("node-schedule");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const xlsx = require("xlsx");
const { Feedback } = require("./feedbackModel");
const { User } = require("../user/userModel");

const authId = process.env.OUTLOOK_ID;
const authPass = process.env.OUTLOOK_PASS;
const name_id = process.env.NAME_ID;

const feedbackFilePath = path.join(
  __dirname,
  "../output",
  "Feedback_Report.xlsx"
);

// Schedule to send feedback report email ( on 1st of every month at 12 PM) -
const feedbackScheduler = () => {
  schedule.scheduleJob("0 12 1 * *", async () => {
    console.log("time approach");
    try {
      if (!fs.existsSync(feedbackFilePath)) {
        console.log("Feedback file not found. Skipping email.");
        return;
      }

      const transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false,
        auth: {
          user: authId,
          pass: authPass,
        },
      });

      const mailOptions = {
        from: `"${name_id}" <${authId}>`,
        to: "krish.raj@iitg.ac.in", // Change to hab one
        subject: "Monthly Feedback Report",
        text: "PFA the monthly feedback report from students.",
        attachments: [
          {
            filename: "Feedback_Report.xlsx",
            path: feedbackFilePath,
          },
        ],
      };

      const info = await transporter.sendMail(mailOptions); // generate message id
      console.log(`Feedback report email sent: ${info.messageId}`);
    } catch (err) {
      console.error("Failed to send feedback report:", err);
    }
  });
};

const feedbackAutoScheduler = () => {
  // 25th of every month at 9 AM IST (3:30 AM UTC)
  schedule.scheduleJob("0 3 25 * *", async () => {
    try {
      const { FeedbackSettings } = require("./feedbackSettingsModel");

      // Get current settings
      let settings = await FeedbackSettings.findOne();
      if (!settings) {
        settings = new FeedbackSettings();
        settings.currentWindowNumber = 1;
      }

      // Increment window number and reset user submission flags
      settings.currentWindowNumber += 1;
      settings.isEnabled = true;
      settings.enabledAt = new Date();
      settings.disabledAt = null;

      // Reset all users' feedback submission flags for the new window
      await User.updateMany({}, { $set: { isFeedbackSubmitted: false } });

      await settings.save();
      console.log(
        `Feedback window ${settings.currentWindowNumber} automatically opened on 25th.`
      );
    } catch (error) {
      console.error("Error in automatic feedback scheduling:", error);
    }
  });
};

module.exports = {
  feedbackScheduler,
  feedbackAutoScheduler,
};
