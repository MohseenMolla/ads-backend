import express from "express";
import rateLimit from "express-rate-limit";
import { handleAIChat, getAvailableModels } from "../controllers/aiController.js";

const router = express.Router();

// Anonymous IP Rate Limiter (Protects free keys without user signup)
const anonymousRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes window
  max: 20, // Allows 20 requests per IP address every 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Free daily request limit reached for your IP. Please wait 10 minutes or try another model.",
  },
});

// GET model choices
router.get("/models", getAvailableModels);

// POST process user query (No login middleware attached)
router.post("/chat", anonymousRateLimiter, handleAIChat);

export default router;