import express from "express";
import { classifyItem } from '../services/classifierService';

const router = express.Router();

router.post("/classify", async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "No title provided" });

  try {
    const result = await classifyItem(title);
    return res.status(200).json({ category: result.category, confidence: result.confidence });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Classification failed" });
  }
});

export default router;
