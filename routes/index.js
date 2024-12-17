import { Router } from 'express'
import webhookRoutes from './webhook.routes.js'
import chat from './chat.routes.js'
import auth from './auth.routes.js'
import templates from './template.routes.js'
import dashboard from '../dashboard/routes/dashboard.routes.js'

const router = Router()

router.use('/api', webhookRoutes)
router.use('/api/chat', chat)
router.use('/api/auth', auth)
router.use('/api/templates', templates)
router.use('/api/dashboard', dashboard)


export default router
