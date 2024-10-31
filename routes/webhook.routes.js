import { Router } from 'express'
const router = Router();

import { verificar, recibir } from '../controller/webhook.js';

router.get('/', verificar);
router.post('/', recibir)

export default router;