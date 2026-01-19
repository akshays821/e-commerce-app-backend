import express from "express";
import upload from "../config/multer.js";

import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";
import { protectAdmin, adminOnly } from "../middlewares/authMiddleware.js";


const router = express.Router();

router.get("/", getProducts);


router.post("/", protectAdmin , adminOnly, upload.single("image"), createProduct);
router.put("/:id",protectAdmin , adminOnly, upload.single("image") ,updateProduct);
router.delete("/:id",protectAdmin , adminOnly, deleteProduct);

export default router;
