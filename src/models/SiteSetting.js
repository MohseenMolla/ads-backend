import mongoose from "mongoose";

const heroSlideSchema = new mongoose.Schema({
  tag: {
    type: String,
    default: "GREEN UNIVERSITY OF BANGLADESH",
  },
  title: {
    type: String,
    default: "Welcome to Department of",
  },
  highlight: {
    type: String,
    default: "Artificial Intelligence & Data Science",
  },
  subtitle: {
    type: String,
    default: "Green University of Bangladesh • ADS 251 Batch",
  },
  ctaText: {
    type: String,
    default: "Explore Classes",
  },
  link: {
    type: String,
    default: "/class",
  },
  img: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const siteSettingSchema = new mongoose.Schema(
  {
    heroSlides: [heroSlideSchema],
    examRoutine: {
      imageUrl: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
      title: {
        type: String,
        default: "ADS 251 Exam Routine",
      },
      term: {
        type: String,
        default: "Midterm & Final",
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    classRoutine: {
      imageUrl: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
      title: {
        type: String,
        default: "ADS 251 Class Routine",
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("SiteSetting", siteSettingSchema);
