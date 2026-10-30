import express from "express";
import { verifyToken, optionalAuth } from "../middlewares/auth.middleware.js";
import multer from "multer";

import {
  uploadFile,
  saveLink,
  saveText,
  getMyFiles,
  deleteFile
} from "../controllers/file.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// File uploads: supports both POST / and POST /upload
router.post("/upload", verifyToken, upload.single("file"), uploadFile);
router.post("/", verifyToken, upload.single("file"), uploadFile);

router.post("/link", verifyToken, saveLink);
router.post("/text", verifyToken, saveText);

// GET files: supports personal files, course materials, or all files for admins
router.get("/", optionalAuth, getMyFiles);

router.delete("/:id", verifyToken, deleteFile);

export default router;
