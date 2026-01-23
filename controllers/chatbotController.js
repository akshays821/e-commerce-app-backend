import { GoogleGenerativeAI } from "@google/generative-ai";
import Product from "../models/product.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);



let chatHistory = [];


export const chatbotResponse = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }

    const lowerMessage = message.toLowerCase();

    const isSearch =
      lowerMessage.includes("show") ||
      lowerMessage.includes("find") ||
      lowerMessage.includes("buy") ||
      lowerMessage.includes("under") ||
      lowerMessage.includes("above") ||
      lowerMessage.includes("between") ||
      lowerMessage.includes("cheap");

    if (isSearch) {
      const prompt = `
Extract search keywords AND price filters from the user query.

IMPORTANT RULES:
- If the user makes spelling mistakes, correct them.
- Understand variations like:
  "underrrr", "underr", "uder" → "under"
  "betwen", "btween" → "between"
- Do NOT mention spelling mistakes in the response.
- Return output ONLY in valid JSON.

Return output ONLY in this JSON format:

{
  "keywords": ["...", "..."],
  "price": {
    "min": number | null,
    "max": number | null
  }
}

Examples:

Input: "red shoes underrrr 500"
Output:
{
  "keywords": ["red", "shoes"],
  "price": { "min": null, "max": 500 }
}

Input: "shoe betwen 3500 and 5500"
Output:
{
  "keywords": ["shoe"],
  "price": { "min": 3500, "max": 5500 }
}



User Query: ${message}
      `;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash"
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      const cleanedText = text.replace(/```json|```/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(cleanedText);
      } catch {
        return res.status(500).json({
          success: false,
          message: "AI returned invalid data"
        });
      }

      const keywords = parsed.keywords || [];
      const price = parsed.price || {};

      const query = {};

      if (keywords.length > 0) {
        query.$or = [];
        keywords.forEach((word) => {
          query.$or.push(
            { title: { $regex: word, $options: "i" } },
            { description: { $regex: word, $options: "i" } },
            { category: { $regex: word, $options: "i" } }
          );
        });
      }

      if (price.min !== null || price.max !== null) {
        query.price = {};
        if (price.min !== null) query.price.$gte = price.min;
        if (price.max !== null) query.price.$lte = price.max;
      }

      const products = await Product.find(query);

      return res.json({
        type: "search",
        message: "Here are some results",
        products
      });
    }

    // Normal chat
    
    // . Format the history into a string to send to the AI
    // map over the array to create "User: ..." and "AI: ..." lines
    const historyContext = chatHistory
      .map((entry) => `${entry.role}: ${entry.content}`)
      .join("\n");

    const systemPrompt = `
You are an AI assistant for an e-commerce store.
Help users politely and ask follow-up questions when needed.

PREVIOUS CONVERSATION HISTORY:
${historyContext}
    `;

    const finalPrompt = systemPrompt + "\nUser: " + message;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const result = await model.generateContent(finalPrompt);
    const reply = result.response.text();

    // 2. Save the new interaction to the memory variable
    chatHistory.push({ role: "User", content: message });
    chatHistory.push({ role: "AI", content: reply });

    // Limit history to the last 6 messages
    if (chatHistory.length > 6) {
      chatHistory = chatHistory.slice(-6);
    }

    return res.json({
      type: "chat",
      reply
    });

  } catch (error) {
    console.error("Chatbot Error:", error);

    if (error.status === 503) {
      return res.status(503).json({
        success: false,
        message: "The AI service is currently overloaded. Please try again later."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
