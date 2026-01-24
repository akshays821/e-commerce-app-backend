import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  checkPaymentStatus,
  cancelOrder,
  deleteOrder
} from "../controllers/orderController.js";
import { protectUser, protectAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// --- User Routes ---
// Create new order
router.post("/", protectUser, createOrder);

// Get my orders
router.get("/myorders", protectUser, getMyOrders);

// Check Payment Status (PhonePe)
router.get("/status/:transactionId", protectUser, checkPaymentStatus);

// Cancel Order
router.put("/:id/cancel", protectUser, cancelOrder);

// Delete Order
router.delete("/:id", protectUser, deleteOrder);

// Get single order (User's view)
router.get("/:id", protectUser, getOrderById);


// --- Admin Routes ---
// Get all orders
router.get("/admin/all", protectAdmin, getAllOrders);

// Update order status (Pending -> Shipped -> Delivered)
router.put("/admin/:id/status", protectAdmin, updateOrderStatus);

export default router;
