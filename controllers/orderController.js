import Order from "../models/Order.js";
import crypto from "crypto";
import axios from "axios";

// PhonePe Sandbox Credentials (PUBLICLY AVAILABLE TEST KEYS)
// Alternative Test Credentials as public "PGTESTPAYUAT" often has rate limits or configuration issues
const MERCHANT_ID = "PGTESTPAYUAT86";
const SALT_KEY = "96434309-7796-489d-8924-ab56988a6076";
const SALT_INDEX = 1;
const PHONEPE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";

// 1. Create New Order (PhonePe Integration)
export const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, totalAmount } = req.body;

    if (!req.user) {
        return res.status(401).json({ message: "User authentication failed" });
    }

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    // Map Frontend Items to DB Schema
    // Ensure product ID is valid mongoose ID
    const dbOrderItems = orderItems.map((item) => {
        if (!item._id) throw new Error(`Product ID missing for item: ${item.name}`);
        return {
            name: item.name,
            qty: item.quantity,
            image: item.image,
            price: item.price,
            product: item._id, 
        };
    });

    const transactionId = `T${Date.now()}`; 

    // 1. Create Order in DB first (Status: Pending)
    // This ensures we validate the DB schema BEFORE calling the API
    const newOrder = new Order({
      user: req.user._id,
      orderItems: dbOrderItems,
      shippingAddress,
      paymentMethod: "PhonePe",
      totalAmount,
      paymentStatus: "pending", 
      paymentResult: {
        id: transactionId,
        status: "pending"
      },
      orderStatus: "pending",
    });

    let savedOrder;
    try {
        savedOrder = await newOrder.save();
    } catch (dbError) {
        console.error("Database Save Error:", dbError);
        return res.status(400).json({ message: "Order creation failed (DB)", error: dbError.message });
    }

    // 1. Validate Amount
    const amountInPaise = Math.round(Number(totalAmount) * 100);
    if (isNaN(amountInPaise) || amountInPaise <= 0) {
        return res.status(400).json({ message: "Invalid total amount" });
    }

    // 2. Prepare PhonePe API Call
    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: req.user._id.toString(),
      amount: amountInPaise, 
      redirectUrl: `${process.env.FRONTEND_URL}/payment/success/${transactionId}`,
      redirectMode: "REDIRECT",
      callbackUrl: "https://www.google.com", 
      mobileNumber: "9999999999", 
      paymentInstrument: {
        type: "PAY_PAGE", 
      },
    };

    const payloadString = JSON.stringify(payload);
    const base64EncodedPayload = Buffer.from(payloadString).toString("base64");

    const xVerify = crypto
      .createHash("sha256")
      .update(base64EncodedPayload + "/pg/v1/pay" + SALT_KEY)
      .digest("hex") + "###" + SALT_INDEX;

    try {
        const response = await axios.post(
            `${PHONEPE_HOST_URL}/pg/v1/pay`,
            { request: base64EncodedPayload },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-VERIFY": xVerify,
                    "Accept": "application/json"
                },
            }
        );

        // Success
        res.status(201).json({
            success: true,
            order: savedOrder,
            paymentUrl: response.data.data.instrumentResponse.redirectInfo.url, 
            transactionId: transactionId 
        });

    } catch (apiError) {
        // If API fails, delete the pending order so user can try again
        await Order.findByIdAndDelete(savedOrder._id);
        
        console.error("PhonePe API Error:", apiError.response ? apiError.response.data : apiError.message);
        
        // Return distinct error message for Frontend
        const phonePeMsg = apiError.response?.data?.message || apiError.message;
        const phonePeCode = apiError.response?.data?.code || "UNKNOWN_ERROR";

        return res.status(500).json({ 
            message: `Payment Error: ${phonePeCode} - ${phonePeMsg}`, 
            details: apiError.response ? apiError.response.data : null
        });
    }

  } catch (error) {
    console.error("General Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// 2. Get Logged-In User's Orders
export const getMyOrders = async (req, res) => {
  try {
    // Find orders where 'user' matches the logged-in user ID
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};


// 3. Get Single Order by ID
export const getOrderById = async (req, res) => {
  try {
    // Populate 'user' to get name and email of the person who ordered
    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Security Check: Only Admin or Owner can view
    // req.user is set by authMiddleware
    if (req.user.role !== "admin" && order.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order", error: error.message });
  }
};


// 4. Get All Orders (Admin Only)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "id name").sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};


// 5. Update Order Status (Admin Only)
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update status from body (e.g., 'shipped', 'delivered')
    order.orderStatus = req.body.status || order.orderStatus;

    if (req.body.status === "delivered") {
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);

  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

// 6. Check Payment Status (PhonePe)
export const checkPaymentStatus = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const xVerify = crypto
            .createHash("sha256")
            .update(`/pg/v1/status/${MERCHANT_ID}/${transactionId}` + SALT_KEY)
            .digest("hex") + "###" + SALT_INDEX;

        const response = await axios.get(
            `${PHONEPE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/${transactionId}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-VERIFY": xVerify,
                    "X-MERCHANT-ID": MERCHANT_ID,
                },
            }
        );

        if (response.data.code === "PAYMENT_SUCCESS") {
            // Find order and update to paid
            const order = await Order.findOne({ "paymentResult.id": transactionId });
            if (order) {
                order.paymentStatus = "paid";
                order.paymentResult.status = "success";
                order.orderStatus = "processing"; // Update Order Status to Processing
                order.paymentResult.update_time = Date.now();
                await order.save();
            }
            return res.status(200).json({ success: true, message: "Payment Successful" });
        } else {
            return res.status(400).json({ success: false, message: "Payment Failed or Pending" });
        }

    } catch (error) {
        console.error("Check Status Error:", error.message);
        res.status(500).json({ message: "Status check failed", error: error.message });
    }
};


// 7. Cancel Order
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ensure user owns the order or is admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (order.orderStatus === "shipped" || order.orderStatus === "delivered") {
         return res.status(400).json({ message: "Cannot cancel order that has already been shipped or delivered." });
    }

    order.orderStatus = "cancelled";
    // Optional: If paid, you might want to initiate a refund logic here in a real app
    
    await order.save();
    res.json({ message: "Order cancelled successfully", order });

  } catch (error) {
    res.status(500).json({ message: "Cancel failed", error: error.message });
  }
};

// 8. Delete Order (User can delete cancelled/delivered orders)
export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Ensure user owns the order or is admin
        if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(401).json({ message: "Not authorized" });
        }

        // Only allow deleting cancelled or delivered/completed orders
        if (order.orderStatus !== "cancelled" && order.orderStatus !== "delivered") {
             return res.status(400).json({ message: "Can only delete cancelled or delivered orders." });
        }

        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: "Order deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: "Delete failed", error: error.message });
    }
};
