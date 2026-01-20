import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      name: String, 
      image: String,
      price: Number,
      size: String,
      quantity: {
        type: Number,
        default: 1,
      },
    },
  ],
}, { timestamps: true });

export default mongoose.model("Cart", cartSchema);
