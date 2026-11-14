import Semester from "../models/Semester.js";
import Course from "../models/Course.js";
import File from "../models/File.js";

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
      term: term || "",
      examRoutineUrl: examRoutineUrl || "",
      classRoutineUrl: classRoutineUrl || "",
    });

    res.status(201).json({ success: true, data: semester });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all semesters (with courses populated)
// @route   GET /api/semesters
export const getAllSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find().sort({ createdAt: -1 }).lean();
    const semesterIds = semesters.map((s) => s._id);
    const courses = await Course.find({ semesterId: { $in: semesterIds } }).lean();

    const semestersWithCourses = semesters.map((sem) => ({
      ...sem,
      courses: courses.filter(
        (c) => c.semesterId && c.semesterId.toString() === sem._id.toString()
      ),
    }));

    res.status(200).json({
      success: true,
      count: semestersWithCourses.length,
      data: semestersWithCourses,
    });
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

    // Find and delete courses and their slide files associated with this semester
    const courses = await Course.find({ semesterId: req.params.id });
    const courseIds = courses.map((c) => c._id);
    if (courseIds.length > 0) {
      await File.deleteMany({ courseId: { $in: courseIds } });
      await Course.deleteMany({ semesterId: req.params.id });
    }

    await semester.deleteOne();

    res.status(200).json({
      success: true,
      message: "Semester and all its courses deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
