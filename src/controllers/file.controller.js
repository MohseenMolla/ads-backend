import File from "../models/File.js";
import cloudinary from "../config/cloudinary.js";
import path from "path";
import fs from "fs";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const baseName = path.basename(req.file.originalname, ext);
    
    // Categorize file extensions
    const isImage = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"].includes(ext);
    
    // Cloudinary route configuration:
    // Images use "image" resource_type without suffixing ext in public_id
    // PDFs, DOCX, ZIP, PPT, etc. use "raw" resource_type and REQUIRE the extension in public_id
    const resourceType = isImage ? "image" : "raw";
    const cleanPublicId = isImage 
      ? `${baseName}_${Date.now()}` 
      : `${baseName}_${Date.now()}${ext}`;

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: resourceType,
      public_id: cleanPublicId,
      use_filename: true,
      unique_filename: false,
    });

    // Clean up temporary local upload file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const file = await File.create({
      user: req.user._id,
      courseId: req.body.courseId || null,
      title: req.body.title || req.file.originalname,
      type: "file",
      fileUrl: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
    });

    res.json(file);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
};

export const saveLink = async (req, res) => {
  try {
    const { title, link, courseId } = req.body;
    const data = await File.create({
      user: req.user._id,
      courseId: courseId || null,
      title,
      type: "link",
      link,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveText = async (req, res) => {
  try {
    const { title, text, courseId } = req.body;
    const data = await File.create({
      user: req.user._id,
      courseId: courseId || null,
      title,
      type: "text",
      text,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyFiles = async (req, res) => {
  try {
    const filter = {};

    if (req.query.courseId) {
      filter.courseId = req.query.courseId;
    } else if (req.query.all === "true" || (req.user && req.user.role === "admin" && !req.query.personal)) {
      // Return all files/slides for admin or when specifically requested
    } else if (req.user) {
      // User's private files
      filter.user = req.user._id;
    } else {
      // If unauthenticated, only return public course materials
      filter.courseId = { $ne: null };
    }

    const files = await File.find(filter).sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: "Not found" });
    }

    if (file.type === "file" && file.publicId) {
      await cloudinary.uploader.destroy(file.publicId, {
        resource_type: file.resourceType || "raw",
      });
    }

    await file.deleteOne();
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
