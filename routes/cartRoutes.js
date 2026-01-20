import express from "express";
import { protectUser } from "../middlewares/authMiddleware.js";
import { getCart, addToCart, removeFromCart, updateQuantity, syncCart } from "../controllers/cartController.js";

const router = express.Router();

router.get("/", protectUser, getCart);
router.post("/add", protectUser, addToCart);
router.post("/remove", protectUser, removeFromCart);
router.put("/update", protectUser, updateQuantity);
router.post("/sync", protectUser, syncCart);

export default router;
