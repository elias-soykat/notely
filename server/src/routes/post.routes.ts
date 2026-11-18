import { Router } from 'express';
import { createPost, getPosts } from '../controllers/post.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public post listing
router.get('/', getPosts);

// Authenticated post creation
router.post('/', authenticate, createPost);

export default router;
