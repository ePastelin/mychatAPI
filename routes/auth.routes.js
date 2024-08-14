import { Router } from 'express';
import { createUser, getUsers, userLogin, deleteUser, updateUser, createNumber, logged } from '../controller/auth.js';
import { jwtValidator } from '../middleware/jwtValidator.js';

const router = Router();

router.patch('/users/:id', updateUser)
router.post('/create', createUser);
router.post('/number', createNumber)
router.post('/login', userLogin)
router.get('/users', getUsers)
router.get('/logged', jwtValidator, logged)
router.delete('/users/:id', deleteUser)


export default router