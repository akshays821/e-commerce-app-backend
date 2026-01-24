import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import searchAIRoutes from "./routes/searchAIRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import singleProductRoutes from "./routes/singleProductRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();

app.use("/api/products", productRoutes);
app.use("/api/products", singleProductRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/search-ai", searchAIRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Ecommerce API is running...");
});

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err instanceof Error && err.message.includes("Only")) {
    return res.status(400).json({ message: err.message });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File is too large. Maximum size is 8MB",
    });
  }

  res.status(500).json({
    message: err.message || "Internal Server Error",
  });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
