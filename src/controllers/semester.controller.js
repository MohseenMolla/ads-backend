import Semester from "../models/Semester.js";
import Course from "../models/Course.js";

// @desc    Create a new semester
// @route   POST /api/semesters
export const createSemester = async (req, res) => {
  try {
    const { title, term, examRoutineUrl, classRoutineUrl } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const semester = await Semester.create({
      title,
      term,
      examRoutineUrl: examRoutineUrl || "",
      classRoutineUrl: classRoutineUrl || "",
    });

    res.status(201).json({ success: true, data: semester });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all semesters
// @route   GET /api/semesters
export const getAllSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: semesters.length, data: semesters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single semester with its courses
// @route   GET /api/semesters/:id
export const getSemesterById = async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester) {
      return res.status(404).json({ success: false, message: "Semester not found" });
    }

    const courses = await Course.find({ semesterId: req.params.id });

    res.status(200).json({
      success: true,
      data: {
        ...semester.toObject(),
        courses,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a semester
// @route   PUT /api/semesters/:id
export const updateSemester = async (req, res) => {
  try {
    const semester = await Semester.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!semester) {
      return res.status(404).json({ success: false, message: "Semester not found" });
    }

    res.status(200).json({ success: true, data: semester });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a semester
// @route   DELETE /api/semesters/:id
export const deleteSemester = async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester) {
      return res.status(404).json({ success: false, message: "Semester not found" });
    }

    // Safely unlink associated courses instead of deleting them outright
    await Course.updateMany(
      { semesterId: req.params.id },
      { $set: { semesterId: null } }
    );

    await semester.deleteOne();

    res.status(200).json({
      success: true,
      message: "Semester deleted and associated courses unlinked safely",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};