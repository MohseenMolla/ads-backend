import Course from "../models/Course.js";
import File from "../models/File.js";

// @desc    Create a new course
// @route   POST /api/courses
export const createCourse = async (req, res) => {
  try {
    const { semesterId, courseTitle, courseCode } = req.body;

    if (!courseTitle || !courseCode) {
      return res.status(400).json({
        success: false,
        message: "Course title and course code are required",
      });
    }

    const course = await Course.create({
      semesterId: semesterId || null,
      courseTitle,
      courseCode,
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all courses (supports optional ?semesterId= query)
// @route   GET /api/courses
export const getAllCourses = async (req, res) => {
  try {
    const filter = {};
    if (req.query.semesterId) {
      filter.semesterId = req.query.semesterId;
    }

    const courses = await Course.find(filter).populate("semesterId", "title term");
    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single course with all associated slide files
// @route   GET /api/courses/:id
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("semesterId", "title term");
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Finds all slides/topics linked to this course from your existing File model
    const files = await File.find({ courseId: req.params.id }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        ...course.toObject(),
        files,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update course details
// @route   PUT /api/courses/:id
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    await course.deleteOne();
    res.status(200).json({ success: true, message: "Course removed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};