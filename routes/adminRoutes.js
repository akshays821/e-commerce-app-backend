import express from "express";
import { 
  adminLogin, 
  getAllUsers, 
  toggleBanUser, 
  getDashboardStats 
} from "../controllers/adminController.js";
import { protectAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/users", protectAdmin, getAllUsers);
router.put("/users/:id/ban", protectAdmin, toggleBanUser);
router.get("/stats", protectAdmin, getDashboardStats);

export default router;
