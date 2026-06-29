import { Router } from 'express';
import * as bookmarkController from '../controllers/bookmark.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createBookmarkSchema, updateBookmarkSchema } from '../schemas/widget.schema';

const router = Router();

// All bookmark routes require authentication
router.use(authenticate);

router.get('/', bookmarkController.getBookmarks);
router.post('/', validate({ body: createBookmarkSchema }), bookmarkController.createBookmark);
router.put('/:id', validate({ body: updateBookmarkSchema }), bookmarkController.updateBookmark);
router.delete('/:id', bookmarkController.deleteBookmark);

export default router;
