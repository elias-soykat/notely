import { Request, Response, NextFunction } from 'express';

export function requireRole(...roles: ('user' | 'admin')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Access denied due to insufficient permissions' });
      return;
    }

    next();
  };
}
