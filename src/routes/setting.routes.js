import express from "express";
import multer from "multer";
import {
  getSettings,
  uploadHeroSlide,
  deleteHeroSlide,
  uploadExamRoutineImage,
  uploadClassRoutineImage,
} from "../controllers/setting.controller.js";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Public site settings
router.get("/", getSettings);

// Admin asset upload endpoints
router.post("/hero", verifyToken, isAdmin, upload.single("file"), uploadHeroSlide);
router.delete("/hero/:id", verifyToken, isAdmin, deleteHeroSlide);

router.post("/exam-routine", verifyToken, isAdmin, upload.single("file"), uploadExamRoutineImage);
router.post("/class-routine", verifyToken, isAdmin, upload.single("file"), uploadClassRoutineImage);

export default router;
