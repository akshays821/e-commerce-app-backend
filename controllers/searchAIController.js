import { GoogleGenerativeAI } from "@google/generative-ai";
import Product from "../models/product.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const searchAI = async (req, res) => {
  try {
    const { message } = req.body;    

    // 1. Validate input
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const lowerMessage = message.toLowerCase();

    const needsAI =
      lowerMessage.includes("under") ||
      lowerMessage.includes("above") ||
      lowerMessage.includes("between") ||
      lowerMessage.includes("cheap") ||
      lowerMessage.includes("expensive") ||
      lowerMessage.includes("budget");

   //normal search
    if (!needsAI) {
      const regex = new RegExp(message, "i");

      const products = await Product.find({
        $or: [
          { title: regex },
          { description: regex },
          { category: regex },
        ],
      });

      return res.json({
        success: true,
        source: "normal",
        total: products.length,
        products,
      });
    }

    // ai search

    const prompt = `
Extract search keywords and price filters from the user query.

Return ONLY valid JSON in this format:

{
  "keywords": ["...", "..."],
  "price": {
    "min": number | null,
    "max": number | null
  }
}

Examples:

Input: "shoes under 5000"
Output:
{
  "keywords": ["shoes"],
  "price": { "min": null, "max": 5000 }
}

Input: "cheap headphones"
Output:
{
  "keywords": ["headphones"],
  "price": { "min": null, "max": null }
}

User Query: ${message}
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // 3. Parse AI JSON safely
    let parsed;
    try {
      const cleanedText = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleanedText);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "AI response parsing failed",
      });
    }

    const keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];
    const minPrice = parsed.price?.min ?? null;
    const maxPrice = parsed.price?.max ?? null;

    // 4. Build MongoDB query
    const query = {};

    if (keywords.length > 0) {
      query.$or = [];

      keywords.forEach((word) => {
        const regex = new RegExp(word, "i");
        query.$or.push(
          { title: regex },
          { description: regex },
          { category: regex }
        );
      });
    }

    if (minPrice !== null || maxPrice !== null) {
      query.price = {};
      if (minPrice !== null) query.price.$gte = minPrice;
      if (maxPrice !== null) query.price.$lte = maxPrice;
    }

    // 5. Fetch products
    const products = await Product.find(query);

    return res.json({
      success: true,
      source: "ai",
      total: products.length,
      products,
    });

  } catch (err) {
    console.error("Search AI Error:", err.message);

    if (err.message.includes("Quota exceeded")) {
      return res.status(429).json({
        success: false,
        type: "quota",
        message: "AI search limit reached. Please try again in a minute.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
