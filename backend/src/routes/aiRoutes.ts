import { Router } from "express";
import { generateSuggestedReply } from "../controllers/aiController";

const router = Router();

router.post("/suggest-reply", generateSuggestedReply);

export default router;
