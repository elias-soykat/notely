import { describe, it, expect, afterEach } from 'vitest';
import { connectDB, disconnectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

describe('Database Connection', () => {
  afterEach(async () => {
    await disconnectDB();
  });

  it('connects to mongoose successfully with valid URI', async () => {
    await connectDB();
    expect(mongoose.connection.readyState).toBe(1);
  });
});
