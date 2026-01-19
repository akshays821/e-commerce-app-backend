import express from "express";
import { registerUser, loginUser, getProfile } from "../controllers/userController.js";
import { protectUser } from "../middlewares/authMiddleware.js";
import { googleAuth } from "../controllers/googleAuthController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth); // New Google Route
router.get("/profile", protectUser, getProfile);

export default router;
