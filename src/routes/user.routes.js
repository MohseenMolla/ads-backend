import express from "express";
import protect from "../middlewares/auth.middleware.js";
import { changePassword } from "../controllers/user.controller.js";

const router = express.Router();

router.put("/change-password", protect, changePassword);

export default router;