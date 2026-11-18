import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { connectDB, disconnectDB } from '../../src/config/db.js';
import { User } from '../../src/models/User.js';
import { Note } from '../../src/models/Note.js';
import { generateToken } from '../../src/utils/jwt.js';

describe('Note Routes & Deterministic Pagination', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let adminToken: string;
  let adminId: string;

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({ email: /@noteroute\.test$/ });
    await Note.deleteMany({ title: /^Note / });

    const u1 = await User.create({
      name: 'User One',
      email: 'u1@noteroute.test',
      password: 'password123',
      role: 'user',
    });
    user1Id = u1._id.toString();
    user1Token = generateToken({ id: user1Id, role: 'user', email: u1.email });

    const u2 = await User.create({
      name: 'User Two',
      email: 'u2@noteroute.test',
      password: 'password123',
      role: 'user',
    });
    user2Id = u2._id.toString();
    user2Token = generateToken({ id: user2Id, role: 'user', email: u2.email });

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@noteroute.test',
      password: 'password123',
      role: 'admin',
    });
    adminId = admin._id.toString();
    adminToken = generateToken({ id: adminId, role: 'admin', email: admin.email });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@noteroute\.test$/ });
    await Note.deleteMany({ title: /^Note / });
    await disconnectDB();
  });

  beforeEach(async () => {
    await Note.deleteMany({ title: /^Note / });
  });

  it('creates note for authenticated user', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Note 1',
        content: 'Content for Note 1',
      });

    expect(res.status).toBe(201);
    expect(res.body.note.title).toBe('Note 1');
    expect(res.body.note.userId).toBe(user1Id);
  });

  it('regular user lists only their own notes with deterministic pagination', async () => {
    // Seed 3 notes for user 1 and 2 notes for user 2
    for (let i = 1; i <= 3; i++) {
      await Note.create({
        title: `Note U1-${i}`,
        content: `Content ${i}`,
        userId: user1Id,
      });
    }
    for (let i = 1; i <= 2; i++) {
      await Note.create({
        title: `Note U2-${i}`,
        content: `Content ${i}`,
        userId: user2Id,
      });
    }

    const res = await request(app)
      .get('/api/notes?page=1&limit=2')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
    expect(res.body.totalCount).toBe(3);
    expect(res.body.totalPages).toBe(2);
    expect(res.body.data.length).toBe(2);
    // User 1 only sees their notes
    expect(res.body.data.every((n: any) => n.userId === user1Id)).toBe(true);
  });

  it('admin lists notes from all users with pagination', async () => {
    await Note.create({ title: 'Note U1-A', content: 'C', userId: user1Id });
    await Note.create({ title: 'Note U2-A', content: 'C', userId: user2Id });

    const res = await request(app)
      .get('/api/notes?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalCount).toBe(2);
    expect(res.body.data.length).toBe(2);
  });

  it('returns 400 when admin provides invalid userId format in query parameter', async () => {
    const res = await request(app)
      .get('/api/notes?userId=not-a-valid-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid user id format/i);
  });

  it('enforces RBAC on note viewing, editing, and deletion', async () => {
    const note = await Note.create({
      title: 'Note Private',
      content: 'Secret content',
      userId: user1Id,
    });
    const noteId = note._id.toString();

    // User 2 tries to view User 1's note -> 403
    const viewRes = await request(app)
      .get(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(viewRes.status).toBe(403);

    // Admin can view User 1's note -> 200
    const adminViewRes = await request(app)
      .get(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminViewRes.status).toBe(200);

    // User 2 tries to update User 1's note -> 403
    const updateRes = await request(app)
      .put(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ title: 'Hacked Title' });
    expect(updateRes.status).toBe(403);

    // User 1 updates their note -> 200
    const ownerUpdateRes = await request(app)
      .put(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Note Updated' });
    expect(ownerUpdateRes.status).toBe(200);
    expect(ownerUpdateRes.body.note.title).toBe('Note Updated');

    // User 2 tries to delete User 1's note -> 403
    const deleteForbiddenRes = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(deleteForbiddenRes.status).toBe(403);

    // Admin can delete any note -> 200
    const adminDeleteRes = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminDeleteRes.status).toBe(200);
  });
});
