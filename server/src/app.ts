import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import noteRoutes from './routes/note.routes.js';
import adminRoutes from './routes/admin.routes.js';
import aggregationRoutes from './routes/aggregation.routes.js';
import postRoutes from './routes/post.routes.js';
import userRoutes from './routes/user.routes.js';

export const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/aggregations', aggregationRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Centralized error handler
app.use((err: Error & { status?: number; name?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    res.status(400).json({ error: err.message });
    return;
  }
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  const message = config.nodeEnv === 'production' && status === 500
    ? 'Internal server error'
    : (err.message || 'Internal server error');

  res.status(status).json({ error: message });
});
