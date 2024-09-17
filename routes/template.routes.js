import { Router } from 'express'
import { jwtValidator } from '../middleware/jwtValidator.js'
import { createTemplate } from '../controller/template.js'
const router = Router()

router.post('/create', jwtValidator, createTemplate)

export default router

