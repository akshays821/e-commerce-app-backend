import jwt from "jsonwebtoken";
import Admin from "../models/admin.js";
import User from "../models/user.js";

// protect admin routes
export const protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(401).json({ message: "Not authorized" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized" });
  }
};

// protect user routes
export const protectUser = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "Access denied. Your account has been banned." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized" });
  }
};

// admin-only check
export const adminOnly = (req, res, next) => {
  if (!req.admin || req.admin.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};
