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
    password: hashed,
    role: "user",
  });

  res.status(201).json({
    token: generateToken(user._id),
    user: {
      _id: user._id,
      name: user.name,
      studentId: user.studentId,
      role: user.role || "user",
    },
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

  // Include user data and role with the token
  res.json({
    token: generateToken(user._id),
    user: {
      _id: user._id,
      name: user.name,
      studentId: user.studentId,
      role: user.role || "user",
    },
  });
};

export const logout = async (req, res) => {
  res.json({
    message: "User logged out successfully",
  });
};