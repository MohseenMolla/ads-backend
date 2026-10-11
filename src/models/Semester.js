import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Semester title is required"], // e.g. "Fifth Semester - Final"
      trim: true,
    },
    term: {
      type: String, // e.g. "Mid Term", "Final", or optional
      trim: true,
      default: "",
    },
    examRoutineUrl: {
      type: String,
      default: "",
    },
    classRoutineUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Semester", semesterSchema);