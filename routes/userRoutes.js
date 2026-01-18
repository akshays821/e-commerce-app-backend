import express from "express";
import { registerUser, loginUser } from "../controllers/userController.js";
import { googleAuth } from "../controllers/googleAuthController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth); // New Google Route

export default router;
