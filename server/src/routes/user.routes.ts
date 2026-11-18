import { Router } from 'express';
import { getUserPosts } from '../controllers/aggregation.controller.js';

const router = Router();

// Scenario 2: Retrieve all posts belonging to a particular user via single User.aggregate() with $lookup
router.get('/:userId/posts', getUserPosts);

export default router;
