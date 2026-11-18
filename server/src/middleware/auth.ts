import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or malformed authorization token' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }
}
