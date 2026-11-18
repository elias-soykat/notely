import { describe, it, expect, vi } from 'vitest';
import { generateToken, verifyToken } from '../../src/utils/jwt.js';
import { authenticate } from '../../src/middleware/auth.js';
import { requireRole } from '../../src/middleware/rbac.js';
import { Request, Response, NextFunction } from 'express';

describe('Auth & RBAC Middleware', () => {
  it('generates and verifies JWT tokens correctly', () => {
    const payload = { id: 'user123', role: 'user', email: 'user@example.com' };
    const token = generateToken(payload);
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.email).toBe(payload.email);
  });

  describe('authenticate middleware', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const req = { headers: {} } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringMatching(/unauthorized|token/i) })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when token is invalid', async () => {
      const req = { headers: { authorization: 'Bearer invalid_token' } } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('attaches user and calls next when token is valid', async () => {
      const payload = { id: 'user123', role: 'user', email: 'user@example.com' };
      const token = generateToken(payload);

      const req = { headers: { authorization: `Bearer ${token}` } } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(payload.id);
      expect(req.user.role).toBe(payload.role);
    });
  });

  describe('requireRole middleware', () => {
    it('returns 403 when user role is not authorized', () => {
      const req = { user: { id: 'u1', role: 'user', email: 'u@test.com' } } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      const adminOnly = requireRole('admin');
      adminOnly(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringMatching(/forbidden|access denied/i) })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next when user role matches requirement', () => {
      const req = { user: { id: 'a1', role: 'admin', email: 'a@test.com' } } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      const adminOnly = requireRole('admin');
      adminOnly(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
