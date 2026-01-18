import Admin from "../models/admin.js";
import User from "../models/User.js";
import Product from "../models/product.js";
import jwt from "jsonwebtoken";

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare password (uses model method)
    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error("Admin login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Ban/Unban User
export const toggleBanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.isBanned = !user.isBanned;
      await user.save();
      res.json({ message: `User ${user.isBanned ? "banned" : "unbanned"}`, isBanned: user.isBanned });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Get Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    
    // Calculate potential revenue (Sum of all product prices * stock) - just as a metric
    const products = await Product.find({}).select("price stock");
    const potentialRevenue = products.reduce((acc, item) => acc + (item.price * item.stock), 0);

    res.json({
      totalUsers,
      totalProducts,
      totalRevenue: potentialRevenue,
      activeUsers: await User.countDocuments({ isBanned: { $ne: true } })
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
