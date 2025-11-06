import { Request, Response } from "express";
import { handleAIReply } from "../services/aiReplyService";

export const generateSuggestedReply = async (req: Request, res: Response) => {
  try {
    const { id, text } = req.body;
    if (!id || !text)
      return res.status(400).json({ error: "Missing email id or text" });

    const reply = await handleAIReply(id, text);
    res.json({ reply });
  } catch (err) {
    console.error("AI reply error:", err);
    res.status(500).json({ error: "Failed to generate AI reply" });
  }
};
