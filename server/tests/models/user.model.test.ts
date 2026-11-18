import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../../src/config/db.js';
import { User } from '../../src/models/User.js';

describe('User Model', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@test\.com$/ });
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({ email: /@test\.com$/ });
  });

  it('hashes password upon save and validates with comparePassword', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'testuser@test.com',
      password: 'password123',
      interests: ['coding', 'reading'],
    });

    expect(user.password).not.toBe('password123');
    expect(user.role).toBe('user');
    expect(user.interests).toEqual(['coding', 'reading']);

    const isMatch = await user.comparePassword('password123');
    expect(isMatch).toBe(true);

    const isWrong = await user.comparePassword('wrongpass');
    expect(isWrong).toBe(false);
  });

  it('enforces unique email constraint', async () => {
    // Wait for index creation on collection
    await User.init();

    await User.create({
      name: 'User 1',
      email: 'unique@test.com',
      password: 'password123',
    });

    await expect(
      User.create({
        name: 'User 2',
        email: 'unique@test.com',
        password: 'password123',
      })
    ).rejects.toThrow();
  });

  it('declares exact required schema indexes and no unnecessary indexes', () => {
    const indexes = User.schema.indexes();

    const emailIndex = indexes.find(
      ([fields, options]) => fields.email === 1 && options?.unique === true
    );
    expect(emailIndex).toBeDefined();

    const tieBreakerIndex = indexes.find(
      ([fields]) => fields.createdAt === -1 && fields._id === -1
    );
    expect(tieBreakerIndex).toBeDefined();

    // Verify NO interests index
    const interestsIndex = indexes.find(([fields]) => fields.interests !== undefined);
    expect(interestsIndex).toBeUndefined();

    // Verify NO explicit _id only index
    const explicitIdIndex = indexes.find(
      ([fields]) => Object.keys(fields).length === 1 && fields._id !== undefined
    );
    expect(explicitIdIndex).toBeUndefined();
  });
});
