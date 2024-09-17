import { Router } from 'express'
import { jwtValidator } from '../middleware/jwtValidator'
import { createTemplate } from '../controller/template'
const router = Router()

router.post('/create', jwtValidator, createTemplate)

export default router

