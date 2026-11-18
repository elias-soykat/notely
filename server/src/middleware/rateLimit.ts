import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

// Auth rate limiter to protect against brute-force attacks on credentials (disabled in test suite)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' },
  skip: () => config.nodeEnv === 'test',
});
