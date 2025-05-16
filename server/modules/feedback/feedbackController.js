const { User } = require('../user/userModel');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const feedbackFilePath = path.join(__dirname, '../output', 'Feedback_Report.xlsx');

const submitFeedback = async (req, res) => {
  try {
    const { name, rollNumber, breakfast, lunch, dinner, comment } = req.body;
     console.log('Received feedback:', req.body);
    if (!name || !rollNumber || !breakfast || !lunch || !dinner) {
      return res.status(400).send("Incomplete feedback data");
    }

    // 1. Find user by name and rollNumber
    const user = await User.findOne({ name, rollNumber });
    if (!user) return res.status(404).send("User not found");

    // 2. Reject if already submitted
    if (user.feedbackSubmitted) {
      return res.status(400).send("Feedback already submitted by this user");
    }

    // 3. Get hostel name
    let hostelName = 'Unknown';
    if (user.hostel) {
      const hostelDoc = await Hostel.findById(user.hostel);
      hostelName = hostelDoc?.hostel_name || 'Unknown';
    }

    // 4. Get current mess name
    let currentMessName = 'Unknown';
    if (user.curr_subscribed_mess) {
      const currMessDoc = await Hostel.findById(user.curr_subscribed_mess);
      currentMessName = currMessDoc?.hostel_name || 'Unknown';
    }

    // 5. Prepare Excel entry
    const newEntry = {
      User: user.name,
      RollNumber: user.rollNumber,
      Hostel: hostelName,
      CurrentMess: currentMessName,
      Breakfast: breakfast,
      Lunch: lunch,
      Dinner: dinner,
      Comment: comment || 'No comment',
      Date: new Date().toLocaleDateString(),
    };

    let data = [];
    if (fs.existsSync(feedbackFilePath)) {
      const workbook = xlsx.readFile(feedbackFilePath);
      const worksheet = workbook.Sheets['Feedback'];
      data = xlsx.utils.sheet_to_json(worksheet);
    }

    data.push(newEntry);

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Feedback');
    fs.mkdirSync(path.dirname(feedbackFilePath), { recursive: true });
    xlsx.writeFile(workbook, feedbackFilePath);

    // 6. Mark feedback as submitted
    user.feedbackSubmitted = true;
    await user.save();

    res.status(200).send("Feedback submitted successfully");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving feedback");
  }
};

const removeFeedback = async (req, res) => {
  try {
    const { name, rollNumber } = req.body;
    if (!name || !rollNumber) {
      return res.status(400).send("Name and Roll Number required");
    }

    // 1. Find the user
    const user = await User.findOne({ name, rollNumber });
    if (!user) {
      return res.status(404).send("User not found");
    }

    if (!user.feedbackSubmitted) {
      return res.status(400).send("No feedback submitted by this user");
    }

    // 2. Update user document
    user.feedbackSubmitted = false;
    await user.save();

    // 3. Remove entry from Excel file (if exists)
    if (fs.existsSync(feedbackFilePath)) {
      const workbook = xlsx.readFile(feedbackFilePath);
      const worksheet = workbook.Sheets['Feedback'];
      let data = xlsx.utils.sheet_to_json(worksheet);

      // Filter out feedback of the user
      data = data.filter(entry =>
        entry.RollNumber !== rollNumber || entry.User !== name
      );

      const newSheet = xlsx.utils.json_to_sheet(data);
      const newWorkbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'Feedback');
      xlsx.writeFile(newWorkbook, feedbackFilePath);
    }

    res.status(200).send("Feedback removed successfully");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error removing feedback");
  }
};


module.exports = {
  submitFeedback,
  removeFeedback
};




//const { User } = require('../user/userModel');
//const xlsx = require('xlsx');
//const path = require('path');
//const fs = require('fs');
//
//const feedbackFilePath = path.join(__dirname, '../output', 'Feedback_Report.xlsx');
//
//// updating feedback list sheet with user who sbmitted the sheet
//const submitFeedback = async (req, res) => {
//  try {
//    const { userId, breakfast, lunch, dinner, comment } = req.body;
//
//    if (!userId || !breakfast || !lunch || !dinner) {
//      return res.status(400).send("Incomplete feedback data");
//    }
//
//    //getting user with Id
//    const user = await User.findById(userId);
//    if (!user) return res.status(404).send("User not found");
//
//      //rejecting if user already sbmitted
//    if (user.feedbackSubmitted) {
//         return res.status(400).send("Feedback already submitted by this user");
//    }
//
//
//    //  get the hostel name if user has a hostel assigned
//    let hostelName = 'Unknown';
//    if (user.hostel) {
//      const hostelDoc = await Hostel.findById(user.hostel);
//      hostelName = hostelDoc?.hostel_name || 'Unknown';
//    }
//
//    //  get the current mess name if subscribed
//    let currentMessName = 'Unknown';
//    if (user.curr_subscribed_mess) {
//      const currMessDoc = await Hostel.findById(user.curr_subscribed_mess);
//      currentMessName = currMessDoc?.hostel_name || 'Unknown';
//    }
//
//
//
////data putting in excel sheet
//    const newEntry = {
//      User: user.name,
//      RollNumber: user.rollNumber,
//      Hostel: hostelName,
//      CurrentMess: currentMessName,
//      Breakfast: breakfast,
//      Lunch: lunch,
//      Dinner: dinner,
//      Comment: comment || 'No comment',
//      Date: new Date().toLocaleDateString(),
//    };
//
//
//
//    let data = [];
//    //checking if excel path already exist or not
//    if (fs.existsSync(feedbackFilePath)) {
//      const workbook = xlsx.readFile(feedbackFilePath);
//      const worksheet = workbook.Sheets['Feedback'];
//      data = xlsx.utils.sheet_to_json(worksheet);
//    }
//    //otherwise update sheet
//    data.push(newEntry);
//
//    const worksheet = xlsx.utils.json_to_sheet(data);
//    //a new workbook
//    const workbook = xlsx.utils.book_new();
//
//    xlsx.utils.book_append_sheet(workbook, worksheet, 'Feedback');
//    fs.mkdirSync(path.dirname(feedbackFilePath), { recursive: true });
//    xlsx.writeFile(workbook, feedbackFilePath);
//
//// update bool value
//    user.feedbackSubmitted = true;
//    await user.save();
//
//    res.status(200).send("Feedback submitted successfully");
//  } catch (err) {
//    console.error(err);
//    res.status(500).send("Error saving feedback");
//  }
//};
//
//
//// Sends the saved Excel file to the client
////const downloadFeedbackSheet = (req, res) => {
////  if (!fs.existsSync(feedbackFilePath)) {
////    return res.status(404).send("No feedback report found");
////  }
//// console.log("Looking for file at:", feedbackFilePath);
////
////  res.download(feedbackFilePath, 'Feedback_Report.xlsx', (err) => {
////    if (err) {
////      console.error("Download error:", err);
////      res.status(500).send("Could not download feedback report");
////    }
////  });
////};
//
//module.exports = {
//  submitFeedback,
////  downloadFeedbackSheet,
//};
