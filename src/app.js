import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import fileRoutes from "./routes/file.routes.js";
import semesterRoutes from "./routes/semester.routes.js";
import courseRoutes from "./routes/course.routes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running");
});

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// Existing routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/files", fileRoutes);

// Newly added routes
app.use("/api/semesters", semesterRoutes);
app.use("/api/courses", courseRoutes);

export default app;