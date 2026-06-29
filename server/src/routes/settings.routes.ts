import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { updateSettingsSchema } from '../schemas/widget.schema';

const router = Router();

// All settings routes require authentication
router.use(authenticate);

router.get('/', settingsController.getSettings);
router.get('/news', settingsController.getNewsHeadlines);
router.put('/', validate({ body: updateSettingsSchema }), settingsController.updateSettings);
router.put('/email-preferences', settingsController.updateEmailPreferences);

export default router;
