import express from "express";
import {
  createSemester,
  getAllSemesters,
  getSemesterById,
  updateSemester,
  deleteSemester,
} from "../controllers/semester.controller.js";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes for viewing
router.get("/", getAllSemesters);
router.get("/:id", getSemesterById);

// Admin-only management routes
router.post("/", verifyToken, isAdmin, createSemester);
router.put("/:id", verifyToken, isAdmin, updateSemester);
router.delete("/:id", verifyToken, isAdmin, deleteSemester);

export default router;