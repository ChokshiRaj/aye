import { Router } from 'express';
import * as focusController from '../controllers/focus.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/log', authenticate, focusController.logFocusSession);

export default router;
