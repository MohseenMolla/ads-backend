import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

export const signup = async (req, res) => {
  const { name, studentId, password } = req.body;

  const userExists = await User.findOne({ studentId });

  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    studentId,
    password: hashed
  });

  res.json({
    token: generateToken(user._id)
  });
};

export const login = async (req, res) => {
  const { studentId, password } = req.body;

  const user = await User.findOne({ studentId });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.status(400).json({ message: "Wrong password" });
  }

  res.json({
    token: generateToken(user._id)
  });
};

export const logout = async (req, res) => {
  res.json({
    message: "User logged out successfully"
  });
};