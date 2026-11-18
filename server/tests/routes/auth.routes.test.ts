import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { connectDB, disconnectDB } from '../../src/config/db.js';
import { User } from '../../src/models/User.js';

describe('Auth Routes', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@authroute\.test$/ });
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({ email: /@authroute\.test$/ });
  });

  describe('POST /api/auth/register', () => {
    it('registers a user successfully and returns token and sanitized user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@authroute.test',
          password: 'password123',
          interests: ['music', 'art'],
        });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('jane@authroute.test');
      expect(res.body.user.role).toBe('user');
      expect(res.body.user.password).toBeUndefined();
    });

    it('always assigns role "user" even if request attempts to set "admin"', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Attacker',
          email: 'attacker@authroute.test',
          password: 'password123',
          role: 'admin',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('user');

      const saved = await User.findOne({ email: 'attacker@authroute.test' });
      expect(saved?.role).toBe('user');
    });

    it('rejects duplicate email registration with 409', async () => {
      await User.create({
        name: 'Existing',
        email: 'existing@authroute.test',
        password: 'password123',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Person',
          email: 'existing@authroute.test',
          password: 'password123',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already registered|conflict/i);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Login User',
        email: 'login@authroute.test',
        password: 'password123',
      });
    });

    it('logs in successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@authroute.test',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('login@authroute.test');
    });

    it('returns 401 with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@authroute.test',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid email or password/i);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current authenticated user profile', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Me User',
          email: 'me@authroute.test',
          password: 'password123',
        });

      const token = registerRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('me@authroute.test');
    });

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
