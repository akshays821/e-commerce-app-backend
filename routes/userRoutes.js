import express from "express";
import { registerUser, loginUser, getProfile, verifyEmailOtp } from "../controllers/userController.js";
import { protectUser } from "../middlewares/authMiddleware.js";
import { googleAuth } from "../controllers/googleAuthController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyEmailOtp); // Verification Route
router.post("/login", loginUser);
router.post("/google", googleAuth); // New Google Route
router.get("/profile", protectUser, getProfile);

export default router;
