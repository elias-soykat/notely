import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { connectDB, disconnectDB } from '../../src/config/db.js';
import { User } from '../../src/models/User.js';
import { generateToken } from '../../src/utils/jwt.js';

describe('Scenario 1: Group Users by Interests Aggregation', () => {
  let userToken: string;

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({ email: /@interestagg\.test$/ });

    const uA = await User.create({
      name: 'Alice',
      email: 'alice@interestagg.test',
      password: 'password123',
      interests: ['chess', 'reading'],
    });
    userToken = generateToken({ id: uA._id.toString(), role: 'user', email: uA.email });

    await User.create({
      name: 'Bob',
      email: 'bob@interestagg.test',
      password: 'password123',
      interests: ['reading', 'coding'],
    });

    await User.create({
      name: 'Charlie',
      email: 'charlie@interestagg.test',
      password: 'password123',
      interests: ['chess'],
    });

    await User.create({
      name: 'Dave',
      email: 'dave@interestagg.test',
      password: 'password123',
      interests: [], // empty interests test case
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@interestagg\.test$/ });
    await disconnectDB();
  });

  it('groups users by interests using exactly one User.aggregate() call', async () => {
    const aggregateSpy = vi.spyOn(User, 'aggregate');

    const res = await request(app)
      .get('/api/aggregations/users-by-interests')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);

    // Strict constraint: Exactly ONE aggregate call
    expect(aggregateSpy).toHaveBeenCalledTimes(1);

    // Verify groups
    const chessGroup = res.body.find((g: any) => g._id === 'chess');
    expect(chessGroup).toBeDefined();
    expect(chessGroup.count).toBe(2);
    expect(chessGroup.users.length).toBe(2);
    expect(chessGroup.users.map((u: any) => u.name).sort()).toEqual(['Alice', 'Charlie']);

    const readingGroup = res.body.find((g: any) => g._id === 'reading');
    expect(readingGroup).toBeDefined();
    expect(readingGroup.count).toBe(2);
    expect(readingGroup.users.length).toBe(2);
    expect(readingGroup.users.map((u: any) => u.name).sort()).toEqual(['Alice', 'Bob']);

    const codingGroup = res.body.find((g: any) => g._id === 'coding');
    expect(codingGroup).toBeDefined();
    expect(codingGroup.count).toBe(1);
    expect(codingGroup.users[0].name).toBe('Bob');

    // Dave with empty interests should not appear as a null or empty group
    const emptyGroup = res.body.find((g: any) => !g._id);
    expect(emptyGroup).toBeUndefined();

    aggregateSpy.mockRestore();
  });
});
