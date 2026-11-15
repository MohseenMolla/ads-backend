import User from "../models/User.js";
import VisitorLog from "../models/VisitorLog.js";
import bcrypt from "bcryptjs";

// @desc    Get current user profile & live role
// @route   GET /api/users/profile or /api/user/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password (for authenticated user self)
// @route   PUT /api/users/change-password
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(400).json({ success: false, message: "Wrong current password" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users with activity & time spent stats (Super Admin)
// @route   GET /api/users
export const getAllUsers = async (req, res) => {
  try {
    const { search, role } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }

    if (role && role !== "all") {
      query.role = role;
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate time spent from visitor logs for users
    const userIds = users.map((u) => u._id);
    const userDurations = await VisitorLog.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", totalSeconds: { $sum: "$durationSeconds" } } },
    ]);

    const durationMap = {};
    userDurations.forEach((item) => {
      durationMap[item._id.toString()] = item.totalSeconds;
    });

    const enrichedUsers = users.map((u) => ({
      ...u,
      totalTimeSpentSeconds: durationMap[u._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      count: enrichedUsers.length,
      data: enrichedUsers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user role (Make Admin / Remove Admin / SuperAdmin)
// @route   PUT /api/users/:id/role
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!["user", "admin", "superadmin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role specified" });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Safety check: Cannot demote oneself if you are the current superadmin
    if (req.user._id.toString() === id && role !== "superadmin") {
      return res.status(400).json({
        success: false,
        message: "You cannot remove your own Super Admin role.",
      });
    }

    targetUser.role = role;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully`,
      data: {
        _id: targetUser._id,
        name: targetUser.name,
        studentId: targetUser.studentId,
        role: targetUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user details (name, studentId) (Super Admin)
// @route   PUT /api/users/:id/details
export const updateUserDetails = async (req, res) => {
  try {
    const { name, studentId } = req.body;
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name.trim();
    if (studentId) user.studentId = studentId.trim();

    await user.save();

    res.status(200).json({
      success: true,
      message: "User details updated successfully",
      data: {
        _id: user._id,
        name: user.name,
        studentId: user.studentId,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset user password directly (Super Admin)
// @route   PUT /api/users/:id/reset-password
export const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { id } = req.params;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 4 characters long",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      success: true,
      message: `Password reset successfully for ${user.name}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user account (Super Admin)
// @route   DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own Super Admin account.",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: `User ${user.name} (${user.studentId}) deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
