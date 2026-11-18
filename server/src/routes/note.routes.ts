import { Router } from 'express';
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from '../controllers/note.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createNoteSchema, updateNoteSchema } from '../schemas/validation.schemas.js';

const router = Router();

router.use(authenticate);

router.post('/', validateBody(createNoteSchema), createNote);
router.get('/', getNotes);
router.get('/:id', getNoteById);
router.put('/:id', validateBody(updateNoteSchema), updateNote);
router.delete('/:id', deleteNote);

export default router;
