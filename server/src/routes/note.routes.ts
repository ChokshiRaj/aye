import { Router } from 'express';
import * as noteController from '../controllers/note.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { upsertNoteSchema } from '../schemas/widget.schema';

const router = Router();

// All note routes require authentication
router.use(authenticate);

router.get('/', noteController.getNote);
router.put('/', validate({ body: upsertNoteSchema }), noteController.upsertNote);

export default router;
