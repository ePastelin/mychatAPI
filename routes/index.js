import { Router } from 'express'
import webhookRoutes from './webhook.routes.js'
import chat from './chat.routes.js'
import auth from './auth.routes.js'

const router = Router()

router.use('/api', webhookRoutes)
router.use('/api/chat', chat)
router.use('/api/auth', auth)

export default router
