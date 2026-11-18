import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        const firstIssue = err.issues[0];
        res.status(400).json({ error: firstIssue?.message || 'Invalid request body' });
        return;
      }
      res.status(400).json({ error: 'Malformed request payload' });
    }
  };
}
