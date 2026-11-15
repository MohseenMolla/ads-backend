import express from "express";
import {
  getProfile,
  changePassword,
  getAllUsers,
  updateUserRole,
  updateUserDetails,
  resetUserPassword,
  deleteUser,
} from "../controllers/user.controller.js";
import { verifyToken, isSuperAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Self actions
router.get("/profile", verifyToken, getProfile);
router.put("/change-password", verifyToken, changePassword);

// Super Admin User Management actions
router.get("/", verifyToken, isSuperAdmin, getAllUsers);
router.put("/:id/role", verifyToken, isSuperAdmin, updateUserRole);
router.put("/:id/details", verifyToken, isSuperAdmin, updateUserDetails);
router.put("/:id/reset-password", verifyToken, isSuperAdmin, resetUserPassword);
router.delete("/:id", verifyToken, isSuperAdmin, deleteUser);

export default router;
