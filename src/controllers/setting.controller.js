import SiteSetting from "../models/SiteSetting.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import path from "path";

// Helper: Ensure a settings document exists with defaults
const getOrCreateSettings = async () => {
  let setting = await SiteSetting.findOne();
  if (!setting) {
    setting = await SiteSetting.create({
      heroSlides: [
        {
          tag: "GREEN UNIVERSITY OF BANGLADESH",
          title: "Welcome to Department of",
          highlight: "Artificial Intelligence & Data Science",
          subtitle: "Green University of Bangladesh • ADS 251 Batch",
          ctaText: "Explore Classes",
          link: "/class",
          img: "cls.jpg",
        },
        {
          tag: "GREEN UNIVERSITY OF BANGLADESH",
          title: "Welcome to Department of",
          highlight: "Artificial Intelligence & Data Science",
          subtitle: "Green University of Bangladesh • ADS 251 Batch",
          ctaText: "Explore Classes",
          link: "/class",
          img: "cls2.jpg",
        },
      ],
      examRoutine: {
        imageUrl: "xm2.png",
        title: "ADS 251 Exam Routine",
        term: "Midterm & Final",
        updatedAt: new Date(),
      },
      classRoutine: {
        imageUrl: "",
        title: "ADS 251 Class Routine",
        updatedAt: new Date(),
      },
    });
  }
  return setting;
};

// @desc    Get public site settings (Hero slides, Exam image, Class image)
// @route   GET /api/settings
export const getSettings = async (req, res) => {
  try {
    const setting = await getOrCreateSettings();
    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload & Add a new Hero Image / Slide (Admin)
// @route   POST /api/settings/hero
export const uploadHeroSlide = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Hero image file is required" });
    }

    const { tag, title, highlight, subtitle, ctaText, link } = req.body;

    const ext = path.extname(req.file.originalname).toLowerCase();
    const baseName = path.basename(req.file.originalname, ext);

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "image",
      public_id: `hero_${baseName}_${Date.now()}`,
      use_filename: true,
      unique_filename: false,
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const setting = await getOrCreateSettings();

    const newSlide = {
      tag: tag || "GREEN UNIVERSITY OF BANGLADESH",
      title: title || "Welcome to Department of",
      highlight: highlight || "Artificial Intelligence & Data Science",
      subtitle: subtitle || "Green University of Bangladesh • ADS 251 Batch",
      ctaText: ctaText || "Explore Classes",
      link: link || "/class",
      img: result.secure_url,
      publicId: result.public_id,
      createdAt: new Date(),
    };

    setting.heroSlides.unshift(newSlide);
    await setting.save();

    res.status(201).json({
      success: true,
      message: "Hero slide uploaded successfully",
      data: setting.heroSlides,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a Hero Slide (Admin)
// @route   DELETE /api/settings/hero/:id
export const deleteHeroSlide = async (req, res) => {
  try {
    const setting = await getOrCreateSettings();
    const slide = setting.heroSlides.id(req.params.id);

    if (!slide) {
      return res.status(404).json({ success: false, message: "Slide not found" });
    }

    if (slide.publicId) {
      await cloudinary.uploader.destroy(slide.publicId, { resource_type: "image" }).catch(() => {});
    }

    slide.deleteOne();
    await setting.save();

    res.status(200).json({
      success: true,
      message: "Hero slide deleted successfully",
      data: setting.heroSlides,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload / Update Exam Routine Image (Admin)
// @route   POST /api/settings/exam-routine
export const uploadExamRoutineImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Exam routine image is required" });
    }

    const { title, term } = req.body;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const baseName = path.basename(req.file.originalname, ext);

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "image",
      public_id: `exam_routine_${baseName}_${Date.now()}`,
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const setting = await getOrCreateSettings();

    // Destroy old cloudinary image if present
    if (setting.examRoutine.publicId) {
      await cloudinary.uploader.destroy(setting.examRoutine.publicId, { resource_type: "image" }).catch(() => {});
    }

    setting.examRoutine = {
      imageUrl: result.secure_url,
      publicId: result.public_id,
      title: title || setting.examRoutine.title || "ADS 251 Exam Routine",
      term: term || setting.examRoutine.term || "Midterm & Final",
      updatedAt: new Date(),
    };

    await setting.save();

    res.status(200).json({
      success: true,
      message: "Exam routine image updated successfully",
      data: setting.examRoutine,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload / Update Class Routine Image (Admin)
// @route   POST /api/settings/class-routine
export const uploadClassRoutineImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Class routine image is required" });
    }

    const { title } = req.body;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const baseName = path.basename(req.file.originalname, ext);

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "image",
      public_id: `class_routine_${baseName}_${Date.now()}`,
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const setting = await getOrCreateSettings();

    // Destroy old cloudinary image if present
    if (setting.classRoutine.publicId) {
      await cloudinary.uploader.destroy(setting.classRoutine.publicId, { resource_type: "image" }).catch(() => {});
    }

    setting.classRoutine = {
      imageUrl: result.secure_url,
      publicId: result.public_id,
      title: title || setting.classRoutine.title || "ADS 251 Class Routine",
      updatedAt: new Date(),
    };

    await setting.save();

    res.status(200).json({
      success: true,
      message: "Class routine image updated successfully",
      data: setting.classRoutine,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
