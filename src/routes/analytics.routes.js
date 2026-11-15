import express from "express";
import {
  trackPageView,
  heartbeat,
  getAnalyticsOverview,
} from "../controllers/analytics.controller.js";
import { optionalAuth, verifyToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public tracking endpoints (optionalAuth attaches userId if logged in)
router.post("/track", optionalAuth, trackPageView);
router.post("/heartbeat", heartbeat);

// Protected overview for Admin and Super Admin
router.get("/overview", verifyToken, isAdmin, getAnalyticsOverview);

export default router;
