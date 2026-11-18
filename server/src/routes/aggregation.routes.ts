import { Router } from 'express';
import { getUsersByInterests } from '../controllers/aggregation.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Scenario 1: Group by Interests
router.get('/users-by-interests', getUsersByInterests);

export default router;
