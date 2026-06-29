import { Router } from 'express';
import * as habitController from '../controllers/habit.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createHabitSchema, habitLogSchema } from '../schemas/widget.schema';

const router = Router();

// All habit routes require authentication
router.use(authenticate);

router.get('/', habitController.getHabits);
router.post('/', validate({ body: createHabitSchema }), habitController.createHabit);
router.post('/:id/log', validate({ body: habitLogSchema }), habitController.logHabit);
router.delete('/:id/log', habitController.unlogHabit);
router.put('/:id', validate({ body: createHabitSchema }), habitController.updateHabit);
router.delete('/:id', habitController.deleteHabit);

export default router;
