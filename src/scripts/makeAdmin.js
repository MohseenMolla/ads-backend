import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const studentId = process.argv[2];

if (!studentId) {
  console.log("Usage: node src/scripts/makeAdmin.js <studentId>");
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ studentId });
    if (!user) {
      console.error(`User with studentId "${studentId}" not found.`);
      process.exit(1);
    }

    user.role = "admin";
    await user.save();
    console.log(`Success! User "${user.name}" (studentId: ${user.studentId}) is now an admin.`);
  } catch (err) {
    console.error("Error setting admin role:", err.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();
