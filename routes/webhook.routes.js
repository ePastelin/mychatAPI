import { Router } from 'express'
const router = Router();

import { verificar, recibir } from '../controller/webhook.js';
import { sendMessage } from '../controller/chat.js';

// Rutas existentes
router.get('/', verificar);
router.post('/', recibir)

// Ruta para enviar mensaje a través de la API de Facebook Graph
router.post('/send', sendMessage);



export default router;