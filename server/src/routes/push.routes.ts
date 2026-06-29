import { Router } from 'express';
import * as pushController from '../controllers/push.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// VAPID key is public, doesn't strictly need auth but we can lock it to logged-in users
router.get('/vapid-public-key', authenticate, pushController.getVapidPublicKey);

// Subscribe & test require authentication
router.post('/subscribe', authenticate, pushController.subscribe);
router.delete('/unsubscribe', authenticate, pushController.unsubscribe);
router.post('/test', authenticate, pushController.testPush);

export default router;
