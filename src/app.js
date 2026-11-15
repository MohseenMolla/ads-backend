import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import fileRoutes from "./routes/file.routes.js";
import semesterRoutes from "./routes/semester.routes.js";
import courseRoutes from "./routes/course.routes.js";
import aiRoutes from "./routes/aiRoutes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import settingRoutes from "./routes/setting.routes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/", (req, res) => {
  res.send("API running");
});

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// Auth & Users
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user", userRoutes); // Backwards compatibility for /api/user/change-password

// Files, Academic Semesters & Courses
app.use("/api/files", fileRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/courses", courseRoutes);

// Analytics & Real-Time Visitor Tracking
app.use("/api/analytics", analyticsRoutes);

// Dynamic Site Settings (Hero, Exam Routine Image, Class Routine Image)
app.use("/api/settings", settingRoutes);

// AI Chatbot
app.use("/api/v1/ai", aiRoutes);

export default app;
