import { Router } from 'express';
import * as eventController from '../controllers/event.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createEventSchema, updateEventSchema } from '../schemas/widget.schema';

const router = Router();

// All event routes require authentication
router.use(authenticate);

router.get('/', eventController.getEvents);
router.post('/', validate({ body: createEventSchema }), eventController.createEvent);
router.put('/:id', validate({ body: updateEventSchema }), eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

export default router;
