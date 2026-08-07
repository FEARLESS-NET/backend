/**
 * AUTH ROUTER
 */
import express from 'express';
import { login, verify } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/auth/login', login);
router.get('/auth/verify', verifyToken, verify);

export default router;