import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB  from "./config/db.js";
import productRoutes from "./routes/productRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js"
import searchAIRoutes from "./routes/searchAIRoutes.js"
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

connectDB()

// Routes
app.use("/api/products", productRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/search-ai",searchAIRoutes)
app.use("/api/admin", adminRoutes);



// Default route
app.get("/", (req, res) => {
  res.send("Ecommerce API is running...");
});

app.use((err, req, res, next) => {
  if (err instanceof Error && err.message.includes("Only")) {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File is too large. Maximum size is 8MB"
    });
  }

  next(err);
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
