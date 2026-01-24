import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  
  orderItems: [
    {
      name: { type: String, required: true },
      qty: { type: Number, required: true },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      product: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product", 
        required: true 
      },
    },
  ],

  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },

  paymentMethod: {
    type: String,
    required: true,
    default: "Razorpay",
  },

  paymentResult: {
    id: String,
    status: String,
    email_address: String,
  },

  totalAmount: {
    type: Number,
    required: true,
    default: 0.0,
  },

  paymentStatus: {
    type: String,
    required: true,
    default: "pending", // pending / paid / failed
  },

  orderStatus: {
    type: String,
    required: true,
    default: "pending", // pending / shipped / delivered
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
