import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', AuthController.register);

// POST /api/v1/auth/login
router.post('/login', AuthController.login);

// POST /api/v1/auth/refresh
router.post('/refresh', AuthController.refresh);

// GET /api/v1/auth/me (protected)
router.get('/me', authenticate, AuthController.me);

export default router;