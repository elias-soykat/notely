import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Note, INote } from '../models/Note.js';
import { parsePaginationParams, createPaginatedResponse } from '../utils/pagination.js';
import { getErrorMessage } from '../utils/errors.js';

export async function createNote(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { title, content } = req.body;

    const note = await Note.create({
      title: title.trim(),
      content,
      userId: req.user.id,
    });

    res.status(201).json({ note });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function getNotes(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { page, limit, skip } = parsePaginationParams(req.query);

    const filter: mongoose.FilterQuery<INote> = {};
    if (req.user.role === 'admin') {
      if (req.query.userId) {
        if (!mongoose.Types.ObjectId.isValid(req.query.userId as string)) {
          res.status(400).json({ error: 'Invalid user ID format' });
          return;
        }
        filter.userId = req.query.userId;
      }
    } else {
      filter.userId = req.user.id;
    }

    const [totalCount, notes] = await Promise.all([
      Note.countDocuments(filter),
      Note.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json(createPaginatedResponse(notes, totalCount, page, limit));
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function getNoteById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const id = req.params.id as string;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid note ID format' });
      return;
    }

    const note = await Note.findById(id);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    if (req.user.role !== 'admin' && note.userId.toString() !== req.user.id) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to view this note' });
      return;
    }

    res.status(200).json({ note });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function updateNote(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const id = req.params.id as string;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid note ID format' });
      return;
    }

    const note = await Note.findById(id);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    if (note.userId.toString() !== req.user.id) {
      res.status(403).json({ error: 'Forbidden: Only the owner can update this note' });
      return;
    }

    const { title, content } = req.body;
    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content;

    await note.save();

    res.status(200).json({ note });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function deleteNote(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const id = req.params.id as string;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid note ID format' });
      return;
    }

    const note = await Note.findById(id);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    if (req.user.role !== 'admin' && note.userId.toString() !== req.user.id) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to delete this note' });
      return;
    }

    await note.deleteOne();

    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}
