import { Router } from 'express';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireRole('admin'));

router.get('/users', listUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;
