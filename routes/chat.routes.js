import { Router } from "express";
import {
  chatBot,
  getChats,
  getMessages,
  sendMultimedia,
  getAdminChats,
  updateChatInfo,
} from "../controller/chat.js";
import { adminValidator, jwtValidator } from "../middleware/jwtValidator.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

router.post("/send/multimedia", jwtValidator, upload.single("file"), sendMultimedia);
router.post("/chatbot", chatBot);
router.get("/", jwtValidator, getChats);
router.get("/:id", jwtValidator, getMessages);
router.get("/admin", adminValidator, getAdminChats);
router.patch("/admin", adminValidator, updateChatInfo);

export default router;
