import { Request, Response } from 'express';
import { User, normalizeInterests } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { getErrorMessage } from '../utils/errors.js';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, interests } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'user',
      interests: normalizeInterests(interests),
    });

    const token = generateToken({
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    res.status(201).json({
      token,
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

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken({
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    res.status(200).json({
      token,
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

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}
