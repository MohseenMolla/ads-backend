import express from "express";
import protect from "../middlewares/auth.middleware.js";
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

router.post("/upload", protect, upload.single("file"), uploadFile);

router.post("/link", protect, saveLink);

router.post("/text", protect, saveText);

router.get("/", protect, getMyFiles);

router.delete("/:id", protect, deleteFile);

export default router;