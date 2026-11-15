import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const result = await User.updateMany(
      { studentId: { $in: ["251035003", "1234"] } },
      { $set: { role: "superadmin" } }
    );
    console.log("Updated to superadmin:", result);

    const users = await User.find({ role: "superadmin" });
    console.log("Current Super Admins:", users.map((u) => ({ name: u.name, studentId: u.studentId, role: u.role })));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
