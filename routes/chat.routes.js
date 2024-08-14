import { Router } from 'express';
import { getChats, getMessages, sendMessage } from '../controller/chat.js';
import { jwtValidator } from '../middleware/jwtValidator.js';

const router = Router();

router.post('/send', sendMessage);
router.get('/', jwtValidator, getChats)
router.get('/:id', jwtValidator, getMessages)

export default router