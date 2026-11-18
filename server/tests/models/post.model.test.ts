import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../../src/config/db.js';
import { Post } from '../../src/models/Post.js';

describe('Post Model', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await Post.deleteMany({ title: /^Test Post/ });
    await disconnectDB();
  });

  beforeEach(async () => {
    await Post.deleteMany({ title: /^Test Post/ });
  });

  it('creates post with title, content, and userId', async () => {
    const dummyUserId = new mongoose.Types.ObjectId();
    const post = await Post.create({
      title: 'Test Post Title',
      content: 'Test Post Content',
      userId: dummyUserId,
    });

    expect(post.title).toBe('Test Post Title');
    expect(post.content).toBe('Test Post Content');
    expect(post.userId.toString()).toBe(dummyUserId.toString());
    expect(post.createdAt).toBeDefined();
    expect(post.updatedAt).toBeDefined();
  });

  it('declares exact required schema index for lookup and tie-breaker sorting', () => {
    const indexes = Post.schema.indexes();

    const userPostsIndex = indexes.find(
      ([fields]) => fields.userId === 1 && fields.createdAt === -1 && fields._id === -1
    );
    expect(userPostsIndex).toBeDefined();

    // Verify exactly 1 custom index is declared
    expect(indexes.length).toBe(1);
  });
});
