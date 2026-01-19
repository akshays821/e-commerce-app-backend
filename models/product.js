import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: [String], // Array of strings for multiple categories
    default: [],
  },
  tags: {
    type: [String],
    default: [],
  },
  stock: { type: Number, default: 0 },
  image: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);
export default Product;
