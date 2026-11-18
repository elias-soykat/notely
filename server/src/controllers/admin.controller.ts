import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Note } from '../models/Note.js';
import { Post } from '../models/Post.js';
import { parsePaginationParams, createPaginatedResponse } from '../utils/pagination.js';

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);

    const [totalCount, users] = await Promise.all([
      User.countDocuments(),
      User.find()
        .select('-password')
        .sort({ createdAt: -1, _id: -1 }) // Deterministic pagination tie-breaker
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json(createPaginatedResponse(users, totalCount, page, limit));
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error listing users' });
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role, interests } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role === 'admin' ? 'admin' : 'user',
      interests: Array.isArray(interests) ? interests : [],
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
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error creating user' });
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
    if (role !== undefined) {
      if (!['user', 'admin'].includes(role)) {
        res.status(400).json({ error: 'Validation failed: Role must be either user or admin' });
        return;
      }
      user.role = role;
    }
    if (interests !== undefined && Array.isArray(interests)) user.interests = interests;
    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long' });
        return;
      }
      user.password = password;
    }

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
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message || 'Error updating user' });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
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

    // Cascade delete associated notes and posts
    await Promise.all([
      Note.deleteMany({ userId: user._id }),
      Post.deleteMany({ userId: user._id }),
      user.deleteOne(),
    ]);

    res.status(200).json({ message: 'User and associated data deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error deleting user' });
  }
}
