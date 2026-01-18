import express from "express";
import { protectAdmin } from "../middlewares/authMiddleware.js";
import { 
  createCategory, 
  getAllCategories, 
  deleteCategory 
} from "../controllers/categoryController.js";

const router = express.Router();

router.route("/")
  .post(protectAdmin, createCategory)
  .get(getAllCategories); // Public can see

router.route("/:id")
  .delete(protectAdmin, deleteCategory);

export default router;
