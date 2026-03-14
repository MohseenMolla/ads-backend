import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const changePassword = async (req, res) => {

  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  const match = await bcrypt.compare(oldPassword, user.password);

  if (!match) {
    return res.status(400).json({ message: "Wrong password" });
  }

  user.password = await bcrypt.hash(newPassword, 10);

  await user.save();

  res.json({ message: "Password changed" });
};