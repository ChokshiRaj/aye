import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  verify2faSchema,
  login2faSchema,
} from '../schemas/auth.schema';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Auth Endpoints
router.post('/login', authRateLimiter, validate({ body: loginSchema }), authController.login);
router.post('/verify-otp', authRateLimiter, authController.verifyOtp);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

// Profile & Security Settings Endpoints
router.put('/profile', authenticate, validate({ body: updateProfileSchema }), authController.updateProfile);
router.put('/password', authenticate, validate({ body: changePasswordSchema }), authController.changePassword);

// Active Sessions Endpoints
router.get('/sessions', authenticate, authController.getSessions);
router.delete('/sessions/other', authenticate, authController.revokeOtherSessions);

// Two-Factor Authentication (2FA) Endpoints
router.post('/2fa/setup', authenticate, authController.setup2fa);
router.post('/2fa/verify', authenticate, validate({ body: verify2faSchema }), authController.verify2fa);
router.post('/2fa/disable', authenticate, authController.disable2fa);
router.post('/2fa/login-verify', authRateLimiter, validate({ body: login2faSchema }), authController.loginVerify2fa);

export default router;
