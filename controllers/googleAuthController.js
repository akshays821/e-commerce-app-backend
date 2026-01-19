import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library"; // Import Google library

// Initialize Google Client
// Make sure to add GOOGLE_CLIENT_ID in your .env file
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Login Controller
export const googleAuth = async (req, res) => {
  try {
    // 1. Get the token from frontend
    const { credential } = req.body;

    // 2. Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // 3. Get user info from the token
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload; // 'sub' is the googleId

    // 4. Check if user already exists in our database
    let user = await User.findOne({ email });

    if (user && user.isBanned) {
      return res.status(403).json({ message: "Access denied. Your account has been banned." });
    }

    if (!user) {
      // 5. If user doesn't exist, create a new one
      user = await User.create({
        name: name,
        email: email,
        password: "google-" + googleId, // Dummy password for Google users
        googleId: googleId,
      });
    }

    // 6. Generate our own JWT token for the user
    // This allows them to stay logged in like a normal user
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 7. Send success response
    res.status(200).json({
      message: "Google login successful",
      token,
      _id: user._id,   // Send user data
      name: user.name,
      email: user.email,
    });

  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ message: "Google login failed", error: error.message });
  }
};
