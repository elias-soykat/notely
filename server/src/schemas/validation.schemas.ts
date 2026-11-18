import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name, email, and password are required'),
  email: z
    .string()
    .trim()
    .min(1, 'Name, email, and password are required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long'),
  role: z.string().optional(),
  interests: z.array(z.string()).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email and password are required'),
  password: z.string().min(1, 'Email and password are required'),
});

export const createNoteSchema = z.object({
  title: z.string().trim().min(1, 'Title and content are required'),
  content: z.string().min(1, 'Title and content are required'),
});

export const updateNoteSchema = z.object({
  title: z.string().trim().min(1).optional(),
  content: z.string().optional(),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Name, email, and password are required'),
  email: z
    .string()
    .trim()
    .min(1, 'Name, email, and password are required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['user', 'admin']).optional().default('user'),
  interests: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  role: z.enum(['user', 'admin'], {
    message: 'Validation failed: Role must be either user or admin',
  }).optional(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .optional(),
  interests: z.array(z.string()).optional(),
});

export const createPostSchema = z.object({
  title: z.string().trim().min(1, 'Title and content are required'),
  content: z.string().min(1, 'Title and content are required'),
});
