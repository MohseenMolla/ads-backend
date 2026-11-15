import mongoose from "mongoose";

const visitorLogSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    ip: {
      type: String,
      default: "",
    },
    page: {
      type: String,
      required: true,
      default: "/",
    },
    referrer: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    device: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "other"],
      default: "desktop",
    },
    browser: {
      type: String,
      default: "Chrome",
    },
    durationSeconds: {
      type: Number,
      default: 15,
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for super fast analytics aggregation
visitorLogSchema.index({ createdAt: -1 });
visitorLogSchema.index({ lastHeartbeat: -1 });
visitorLogSchema.index({ page: 1 });

export default mongoose.model("VisitorLog", visitorLogSchema);
