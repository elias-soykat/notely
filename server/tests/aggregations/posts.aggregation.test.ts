import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/app.js';
import { connectDB, disconnectDB } from '../../src/config/db.js';
import { User } from '../../src/models/User.js';
import { Post } from '../../src/models/Post.js';
import { generateToken } from '../../src/utils/jwt.js';

describe('Scenario 2: User Posts Aggregation with $lookup', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({ email: /@postagg\.test$/ });
    await Post.deleteMany({ title: /^Post Agg/ });

    const u1 = await User.create({
      name: 'Author One',
      email: 'u1@postagg.test',
      password: 'password123',
    });
    user1Id = u1._id.toString();
    user1Token = generateToken({ id: user1Id, role: 'user', email: u1.email });

    const u2 = await User.create({
      name: 'Author Two',
      email: 'u2@postagg.test',
      password: 'password123',
    });
    user2Id = u2._id.toString();
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@postagg\.test$/ });
    await Post.deleteMany({ title: /^Post Agg/ });
    await disconnectDB();
  });

  beforeEach(async () => {
    await Post.deleteMany({ title: /^Post Agg/ });
  });

  it('allows authenticated users to create public posts and anyone to list them', async () => {
    const createRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Post Agg 1',
        content: 'Public Content 1',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.post.title).toBe('Post Agg 1');

    const listRes = await request(app).get('/api/posts?page=1&limit=10');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('retrieves user posts using a single User.aggregate() pipeline with $lookup, sorting, and pagination', async () => {
    // Create 3 posts for user 1
    for (let i = 1; i <= 3; i++) {
      await Post.create({
        title: `Post Agg U1-${i}`,
        content: `Content ${i}`,
        userId: user1Id,
      });
    }
    // Create 1 post for user 2
    await Post.create({
      title: 'Post Agg U2-1',
      content: 'Content U2',
      userId: user2Id,
    });

    const aggregateSpy = vi.spyOn(User, 'aggregate');

    // Page 1, limit 2
    const res = await request(app).get(`/api/users/${user1Id}/posts?page=1&limit=2`);

    expect(res.status).toBe(200);
    expect(aggregateSpy).toHaveBeenCalledTimes(1);

    expect(res.body._id).toBe(user1Id);
    expect(res.body.name).toBe('Author One');
    expect(res.body.posts).toBeInstanceOf(Array);
    expect(res.body.posts.length).toBe(2);
    expect(res.body.totalCount).toBe(3);
    expect(res.body.totalPages).toBe(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);

    // Verify posts belong to user 1
    expect(res.body.posts.every((p: any) => p.userId === user1Id)).toBe(true);

    // Page 2, limit 2
    const resPage2 = await request(app).get(`/api/users/${user1Id}/posts?page=2&limit=2`);
    expect(resPage2.status).toBe(200);
    expect(resPage2.body.posts.length).toBe(1);

    aggregateSpy.mockRestore();
  });

  it('handles non-existent user ID cleanly with 404', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/users/${nonExistentId}/posts`);
    expect(res.status).toBe(404);
  });

  it('handles malformed user ID with 400 Bad Request', async () => {
    const res = await request(app).get('/api/users/not-a-valid-id/posts');
    expect(res.status).toBe(400);
  });
});
