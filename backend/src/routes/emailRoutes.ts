import { Router } from "express";
import {
  categorize,
  getEmails,
  searchEmails,
  getEmailById,
} from "../controllers/emailController";

const router = Router();

router.get("/search", searchEmails);
router.get("/getEmails", getEmails);
router.get("/:id", getEmailById);
router.post("/categorize", categorize);

export default router;
