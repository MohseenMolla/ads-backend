import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  title: {
    type: String,
    required: true
  },

  type: {
    type: String,
    enum: ["file", "link", "text"],
    required: true
  },

  fileUrl: String,
  publicId: String,

  link: String,

  text: String

}, { timestamps: true });

export default mongoose.model("File", fileSchema);