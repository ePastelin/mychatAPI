import { Router } from 'express';
import { getChats, getMessages, sendMultimedia } from '../controller/chat.js';
import { jwtValidator } from '../middleware/jwtValidator.js';
import multer from 'multer';

const storage = multer.memoryStorage()
const upload = multer({ storage: storage})

const router = Router();

router.post('/send/multimedia', jwtValidator, upload.single('file'), sendMultimedia)
router.get('/', jwtValidator, getChats)
router.get('/:id', jwtValidator, getMessages)

export default router