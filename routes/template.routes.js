import { Router } from 'express'
import { jwtValidator } from '../middleware/jwtValidator.js'
import { createTemplate, getTemplate, getTemplates, sendTemplate } from '../controller/template.js'
const router = Router()

router.post('/create', jwtValidator, createTemplate)
router.post('/', jwtValidator, sendTemplate)
router.get('/', jwtValidator, getTemplates)
router.get('/:id', jwtValidator, getTemplate)

export default router

