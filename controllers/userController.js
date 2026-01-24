import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
// Google Auth removed to separate controller

import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash the OTP using SHA-256 before storing/comparing it
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const user = await User.create({
      name,
      email,
      password,
      verificationToken: otpHash,
      verificationTokenExpire: Date.now() + 10 * 60 * 1000, // 10 minutes
      isVerified: false
    });

    // Email Message
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email Address</h2>
        <p>Hi ${user.name},</p>
        <p>Your verification code is:</p>
        <h1 style="color: #007bff; letter-spacing: 5px;">${otp}</h1>
        <p>This code is valid for 10 minutes.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "E-Commerce: Your Verification Code",
        message,
      });

      res.status(201).json({
        success: true,
        message: `OTP sent to ${user.email}. Please check your inbox.`,
        email: user.email // Send back email for frontend convenience
      });

    } catch (error) {
      await User.deleteOne({ _id: user._id }); // Rollback user creation if email fails
      console.error(error);
      return res.status(500).json({ message: `Email could not be sent: ${error.message}` });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Hash the otp to match DB
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const user = await User.findOne({
      email,
      verificationToken: otpHash,
      verificationTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    // Send Welcome Email
    const welcomeMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Welcome to E-Commerce!</h2>
        <p>Hi ${user.name},</p>
        <p>Your email has been successfully verified. We are thrilled to have you on board!</p>
        <p>Start shopping now and discover amazing deals.</p>
        <a href="${process.env.FRONTEND_URL}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Go to Store</a>
      </div>
    `;

    try {
        await sendEmail({
        email: user.email,
        subject: "Welcome to E-Commerce!",
        message: welcomeMessage,
        });
    } catch (err) {
        console.error("Welcome email failed:", err);
        // Don't fail the verification if welcome email fails
    }

    // Automatically log user in
    const jwtToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Email verified successfully!",
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "Access denied. Your account has been banned." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update User Profile
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      if (req.body.address) {
          user.address = req.body.address;
      }
      // Cannot update email directly here for security normally, but let's keep it simple
      // user.email = req.body.email || user.email;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        address: updatedUser.address,
        token: req.body.token, // Just to keep frontend structure if needed
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
      res.json(user);
  } else {
      res.status(404).json({ message: "User not found" });
  }
};
