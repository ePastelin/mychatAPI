import { Router } from "express";
import { changeChatbotStatusController, getChatbotStatusController } from "../controllers/chatbot.controller.js";
import { adminValidator } from "../../middleware/jwtValidator.js";

const router = Router()

router.get("/status", adminValidator, getChatbotStatusController)
router.patch("/status", adminValidator, changeChatbotStatusController)

export default router;