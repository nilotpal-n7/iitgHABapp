const admin = require("./firebase.js");
const FCMToken = require("./FCMToken.js");
const User = require("../user/userModel.js");
const { Hostel } = require("../hostel/hostelModel.js");

// Register (or update) FCM token for a user
const registerToken = async (req, res) => {
  try {
    if (!req.user)
      return res.status(403).json({ error: "Only users can register tokens" });

    const curr_sub_mess_name = (
      await Hostel.findById((await req.user.curr_subscribed_mess)._id)
    )["hostel_name"].replaceAll(" ", "_");

    console.log(curr_sub_mess_name);

    const { fcmToken } = req.body;
    if (!fcmToken)
      return res.status(400).json({ error: "FCM token is required" });

    admin.messaging().subscribeToTopic(fcmToken, "All_Hostels");
    admin.messaging().subscribeToTopic(fcmToken, curr_sub_mess_name);

    await FCMToken.findOneAndUpdate(
      { user: req.user._id },
      { token: fcmToken },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: "FCM token registered" });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};
async function sendNotificationMessage(title, body, topic, data = {}) {
  const message = {
    notification: { title, body },
    data: data,
    topic: topic,
  };
  console.log(message);
  await admin.messaging().send(message);
}

// Send a notification directly to a specific user's FCM token
const sendNotificationToUser = async (userId, title, body) => {
  try {
    const tokenDoc = await FCMToken.findOne({ user: userId });
    if (!tokenDoc || !tokenDoc.token) return;
    const message = {
      token: tokenDoc.token,
      notification: { title, body },
    };
    await admin.messaging().send(message);
  } catch (e) {
    console.error("Error sending user notification:", e);
  }
};
// Send notification to all users of this hostel
const sendNotification = async (req, res) => {
  try {
    const { title, body, topic } = req.body;
    sendNotificationMessage(title, body, topic);
    res.status(200).json({ message: "Notification sent" });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

module.exports = {
  registerToken,
  sendNotification,
  sendNotificationMessage,
  sendNotificationToUser,
};
