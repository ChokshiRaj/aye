import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/', authenticate, analyticsController.getAnalytics);

export default router;
