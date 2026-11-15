import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verify JWT token middleware
export const verifyToken = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token || !token.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing or invalid format",
      });
    }

    token = token.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user (excluding password) to req.user
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found or no longer exists",
      });
    }

    // Silently update lastActive timestamp without waiting to block response
    User.findByIdAndUpdate(req.user._id, { lastActive: new Date() }).exec().catch(() => {});

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed or expired",
      error: error.message,
    });
  }
};

// Optional JWT authentication: populates req.user if valid token provided, but doesn't block if missing
export const optionalAuth = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (token && token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    }
  } catch (error) {
    req.user = null;
  }
  next();
};

// Admin authorization middleware (Admins and SuperAdmins)
export const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "superadmin")) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied. Admins only.",
  });
};

// Super Admin authorization middleware (SuperAdmins only)
export const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === "superadmin") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied. Super Admin privileges required.",
  });
};

// Aliased as protect and default export for backwards compatibility
export const protect = verifyToken;
export default verifyToken;
