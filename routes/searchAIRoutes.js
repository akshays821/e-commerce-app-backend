import express from "express";
import { searchAI } from "../controllers/searchAIController.js";

const router = express.Router();

router.post("/", searchAI);

export default router;
