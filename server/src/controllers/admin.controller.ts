import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User, normalizeInterests } from '../models/User.js';
import { Note } from '../models/Note.js';
import { Post } from '../models/Post.js';
import { parsePaginationParams, createPaginatedResponse } from '../utils/pagination.js';
import { getErrorMessage } from '../utils/errors.js';

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);

    const [totalCount, users] = await Promise.all([
      User.countDocuments(),
      User.find()
        .select('-password')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json(createPaginatedResponse(users, totalCount, page, limit));
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role, interests } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role === 'admin' ? 'admin' : 'user',
      interests: normalizeInterests(interests),
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests,
        createdAt: user.createdAt,
      },
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid user ID format' });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { name, role, interests, password } = req.body;

    if (name !== undefined) user.name = name.trim();
    if (role !== undefined) user.role = role;
    if (interests !== undefined) user.interests = normalizeInterests(interests);
    if (password !== undefined) user.password = password;

    await user.save();

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests,
        createdAt: user.createdAt,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid user ID format' });
      return;
    }

    if (req.user && req.user.id === id) {
      res.status(400).json({ error: 'Cannot delete your own admin account' });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Perform atomic cascade delete via transaction when supported
    try {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        await Note.deleteMany({ userId: user._id }).session(session);
        await Post.deleteMany({ userId: user._id }).session(session);
        await user.deleteOne().session(session);
        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    } catch {
      // Fallback for non-replica set testing environments
      await Promise.all([
        Note.deleteMany({ userId: user._id }),
        Post.deleteMany({ userId: user._id }),
        user.deleteOne(),
      ]);
    }

    res.status(200).json({ message: 'User and associated data deleted successfully' });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}
