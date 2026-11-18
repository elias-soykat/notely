import { Router } from 'express';
import { createPost, getPosts } from '../controllers/post.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createPostSchema } from '../schemas/validation.schemas.js';

const router = Router();

router.get('/', getPosts);
router.post('/', authenticate, validateBody(createPostSchema), createPost);

export default router;
