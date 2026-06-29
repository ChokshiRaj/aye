import { Router } from 'express';
import * as gmailController from '../controllers/gmail.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// OAuth callback is loaded from Google redirects - does not use auth middleware directly
router.get('/callback', gmailController.oauthCallback);

// All other endpoints require session authentication
router.get('/auth-url', authenticate, gmailController.getAuthUrl);
router.get('/status', authenticate, gmailController.getGmailStatus);
router.delete('/disconnect', authenticate, gmailController.disconnectGmail);
router.get('/inbox', authenticate, gmailController.getGmailInbox);

export default router;
