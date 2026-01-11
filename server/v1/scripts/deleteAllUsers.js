require("dotenv").config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require("mongoose");
const { User } = require("../modules/user/userModel.js");

const MONGOdb_uri = process.env.MONGODB_URI;

async function deleteAllUsers() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGOdb_uri);
    console.log("MongoDB connected");

    console.log("Deleting all users...");
    const result = await User.deleteMany({});
    console.log(`✅ Successfully deleted ${result.deletedCount} user(s)`);

    await mongoose.connection.close();
    console.log("Connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error deleting users:", error);
    process.exit(1);
  }
}

deleteAllUsers();

