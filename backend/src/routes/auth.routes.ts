import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validation';
import { authMiddleware } from '../middleware/auth';
import {
  registerSchema,
  loginSchema,
} from '../schemas/auth.schemas';

const router = Router();

// Public routes
router.post(
  '/register',
  validateBody(registerSchema.shape.body),
  authController.register
);

router.post(
  '/login',
  validateBody(loginSchema.shape.body),
  authController.login
);

router.post('/refresh', authController.refresh);

// Protected routes
router.post('/logout', authMiddleware, authController.logout);

router.get('/profile', authMiddleware, authController.getProfile);

export default router;
