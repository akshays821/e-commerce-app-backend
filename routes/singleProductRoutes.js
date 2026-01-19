import express from "express";
import { getSingleProduct } from "../controllers/singleProductController.js";

const router = express.Router();

router.get("/:id", getSingleProduct);

export default router;
