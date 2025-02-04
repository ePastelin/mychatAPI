import { Router } from "express";
import {
  chatBot,
  getChats,
  getMessages,
  sendMultimedia,
  getAdminChats,
  updateChatInfo,
  deleteChat,
} from "../controller/chat.js";
import { adminValidator, jwtValidator } from "../middleware/jwtValidator.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

router.post("/send/multimedia", jwtValidator, upload.single("file"), sendMultimedia);
router.post("/chatbot", chatBot);
router.get("/", jwtValidator, getChats);
router.get("/admin/info", adminValidator, getAdminChats);
router.patch("/admin/info/:id", adminValidator, updateChatInfo);
router.get("/:id", jwtValidator, getMessages);
router.patch("/:id", jwtValidator, deleteChat)

export default router;
