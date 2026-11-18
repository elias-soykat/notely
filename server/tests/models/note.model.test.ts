import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../../src/config/db.js';
import { Note } from '../../src/models/Note.js';

describe('Note Model', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await Note.deleteMany({ title: /^Test Note/ });
    await disconnectDB();
  });

  beforeEach(async () => {
    await Note.deleteMany({ title: /^Test Note/ });
  });

  it('creates note with title, content, and userId', async () => {
    const dummyUserId = new mongoose.Types.ObjectId();
    const note = await Note.create({
      title: 'Test Note Title',
      content: 'Test Note Content',
      userId: dummyUserId,
    });

    expect(note.title).toBe('Test Note Title');
    expect(note.content).toBe('Test Note Content');
    expect(note.userId.toString()).toBe(dummyUserId.toString());
    expect(note.createdAt).toBeDefined();
    expect(note.updatedAt).toBeDefined();
  });

  it('declares exact required schema indexes and no extra indexes', () => {
    const indexes = Note.schema.indexes();

    const userNoteListIndex = indexes.find(
      ([fields]) => fields.userId === 1 && fields.createdAt === -1 && fields._id === -1
    );
    expect(userNoteListIndex).toBeDefined();

    const adminNoteListIndex = indexes.find(
      ([fields]) => Object.keys(fields).length === 2 && fields.createdAt === -1 && fields._id === -1
    );
    expect(adminNoteListIndex).toBeDefined();

    // Verify exactly 2 custom indexes are declared
    expect(indexes.length).toBe(2);
  });
});
