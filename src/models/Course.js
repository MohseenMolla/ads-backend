import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: false, // Optional so older/existing courses don't fail validation
      default: null,
    },
    courseTitle: {
      type: String,
      required: [true, "Course title is required"], // e.g. "Applied Probability and Random Processes"
      trim: true,
    },
    courseCode: {
      type: String,
      required: [true, "Course code is required"], // e.g. "ADS 211"
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);