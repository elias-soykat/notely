import { Router } from 'express';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';
import { createUserSchema, updateUserSchema } from '../schemas/validation.schemas.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/users', listUsers);
router.post('/users', validateBody(createUserSchema), createUser);
router.put('/users/:id', validateBody(updateUserSchema), updateUser);
router.delete('/users/:id', deleteUser);

export default router;
