import { Router } from 'express';
import * as todoController from '../controllers/todo.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createTodoSchema, updateTodoSchema } from '../schemas/widget.schema';

const router = Router();

// All todo routes require authentication
router.use(authenticate);

router.get('/', todoController.getTodos);
router.post('/', validate({ body: createTodoSchema }), todoController.createTodo);
router.patch('/:id', validate({ body: updateTodoSchema }), todoController.updateTodo);
router.delete('/:id', todoController.deleteTodo);

export default router;
