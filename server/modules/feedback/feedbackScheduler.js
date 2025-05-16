const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authId = process.env.OUTLOOK_ID;
const authPass = process.env.OUTLOOK_PASS;
const name_id = process.env.NAME_ID;

const feedbackFilePath = path.join(__dirname, '../output', 'Feedback_Report.xlsx');

// Schedule to send feedback report email ( on 30th of every month at 6 PM) -
const feedbackScheduler = () => {
  schedule.scheduleJob('59 23 30 * *', async () => {
  console.log('time approach')
    try {
      if (!fs.existsSync(feedbackFilePath)) {
        console.log('Feedback file not found. Skipping email.');
        return;
      }

      const transporter = nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
          user: authId,
          pass: authPass,
        },
      });

      const mailOptions = {
        from: `"${name_id}" <${authId}>`,
        to: 'krish.raj@iitg.ac.in', // Change to hab one
        subject: 'Monthly Feedback Report',
        text: 'PFA the monthly feedback report from students.',
        attachments: [
          {
            filename: 'Feedback_Report.xlsx',
            path: feedbackFilePath,
          },
        ],
      };

      const info = await transporter.sendMail(mailOptions); // generate message id
      console.log(`Feedback report email sent: ${info.messageId}`);
    } catch (err) {
      console.error('Failed to send feedback report:', err);
    }
  });
};

module.exports = {

  feedbackScheduler,
};
