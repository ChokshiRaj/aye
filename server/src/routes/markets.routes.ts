import { Router } from 'express';
import * as marketsController from '../controllers/markets.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Require authentication for all market data routes
router.use(authenticate);

router.get('/indices', marketsController.getIndices);
router.get('/movers', marketsController.getMovers);
router.get('/metals', marketsController.getMetals);
router.get('/forex', marketsController.getForex);
router.get('/crypto', marketsController.getCrypto);

export default router;
