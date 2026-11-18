import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { connectDB, disconnectDB } from '../../src/config/db.js';
import { User } from '../../src/models/User.js';
import { generateToken } from '../../src/utils/jwt.js';

describe('Admin User Management Routes', () => {
  let adminToken: string;
  let adminId: string;
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({ email: /@admintest\.test$/ });

    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@admintest.test',
      password: 'password123',
      role: 'admin',
    });
    adminId = admin._id.toString();
    adminToken = generateToken({ id: adminId, role: 'admin', email: admin.email });

    const user = await User.create({
      name: 'Standard User',
      email: 'user@admintest.test',
      password: 'password123',
      role: 'user',
    });
    userId = user._id.toString();
    userToken = generateToken({ id: userId, role: 'user', email: user.email });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@admintest\.test$/ });
    await disconnectDB();
  });

  it('rejects regular users with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/forbidden/i);
  });

  it('returns paginated list of users for admin sorted deterministically', async () => {
    const res = await request(app)
      .get('/api/admin/users?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
    expect(res.body.totalCount).toBeGreaterThanOrEqual(2);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('allows admin to create a new user with specific role', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Second Admin',
        email: 'admin2@admintest.test',
        password: 'password123',
        role: 'admin',
        interests: ['management'],
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('admin');
    expect(res.body.user.email).toBe('admin2@admintest.test');
  });

  it('allows admin to update user role and details', async () => {
    const targetUser = await User.create({
      name: 'To Update',
      email: 'update@admintest.test',
      password: 'password123',
      role: 'user',
    });

    const res = await request(app)
      .put(`/api/admin/users/${targetUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        role: 'admin',
        interests: ['devops', 'security'],
      });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
    expect(res.body.user.interests).toEqual(['devops', 'security']);
  });

  it('returns 400 when admin provides password shorter than 6 characters', async () => {
    const targetUser = await User.create({
      name: 'Short Pass User',
      email: 'shortpass@admintest.test',
      password: 'password123',
      role: 'user',
    });

    const res = await request(app)
      .put(`/api/admin/users/${targetUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 6 characters/i);
  });

  it('returns 400 when payload triggers validation error', async () => {
    const targetUser = await User.create({
      name: 'Validation Error User',
      email: 'validation@admintest.test',
      password: 'password123',
      role: 'user',
    });

    const res = await request(app)
      .put(`/api/admin/users/${targetUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'super_hacker_role' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/validation|role/i);
  });

  it('allows admin to delete a user', async () => {
    const toDelete = await User.create({
      name: 'To Delete',
      email: 'delete@admintest.test',
      password: 'password123',
      role: 'user',
    });

    const res = await request(app)
      .delete(`/api/admin/users/${toDelete._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    const check = await User.findById(toDelete._id);
    expect(check).toBeNull();
  });

  it('prevents an admin from deleting their own account', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot delete your own/i);

    const check = await User.findById(adminId);
    expect(check).not.toBeNull();
  });
});
