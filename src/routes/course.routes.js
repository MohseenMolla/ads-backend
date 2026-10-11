import express from "express";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from "../controllers/course.controller.js";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes for viewing
router.get("/", getAllCourses);
router.get("/:id", getCourseById);

// Admin-only management routes
router.post("/", verifyToken, isAdmin, createCourse);
router.put("/:id", verifyToken, isAdmin, updateCourse);
router.delete("/:id", verifyToken, isAdmin, deleteCourse);

export default router;