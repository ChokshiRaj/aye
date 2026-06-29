import { Router } from 'express';
import * as exportController from '../controllers/export.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/todos', exportController.exportTodos);
router.get('/habits', exportController.exportHabits);
router.get('/notes', exportController.exportNotes);
router.get('/all', exportController.exportFullDump);

export default router;
