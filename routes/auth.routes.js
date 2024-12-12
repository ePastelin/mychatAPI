import { Router } from 'express';
import { createUser, getUsers, userLogin, desactivateUser, updateUser, createNumber, logged, getNumbers } from '../controller/auth.js';
import { jwtValidator } from '../middleware/jwtValidator.js';

const router = Router();

router.patch('/users/:id', updateUser)
router.patch('/users/desactivate/:id', desactivateUser)
router.post('/create', createUser);
router.post('/number', createNumber)
router.post('/login', userLogin)
router.get('/users', getUsers)
router.get('/logged', jwtValidator, logged)
router.get('/numbers/:id', jwtValidator, getNumbers)

export default router