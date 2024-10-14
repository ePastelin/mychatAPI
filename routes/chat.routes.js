import { Router } from 'express';
import { getChats, getMessages, sendMessage, sendMultimedia } from '../controller/chat.js';
import { jwtValidator } from '../middleware/jwtValidator.js';

const router = Router();

router.post('/send', sendMessage);
router.post('/send/multimedia', jwtValidator, sendMultimedia)
router.get('/', jwtValidator, getChats)
router.get('/:id', jwtValidator, getMessages)

export default router