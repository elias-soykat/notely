import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Note } from '../src/models/Note.js';
import { Post } from '../src/models/Post.js';

describe('Database Indexing & Query Execution Plan Audit', () => {
  beforeAll(async () => {
    await connectDB();
    // Synchronize declared indexes with the Atlas database
    await Promise.all([
      User.syncIndexes(),
      Note.syncIndexes(),
      Post.syncIndexes(),
    ]);
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('Strict Indexing Efficiency Verification (Zero Redundant Indexes)', () => {
    it('User collection has strictly required indexes only', async () => {
      const indexes = await User.collection.indexes();
      const indexNames = indexes.map((idx) => idx.name).sort();

      // Required: default _id_, email_1, createdAt_-1__id_-1
      expect(indexNames).toEqual(['_id_', 'createdAt_-1__id_-1', 'email_1']);

      // Assert NO interests index
      const hasInterestsIndex = indexes.some((idx) => idx.key.interests !== undefined);
      expect(hasInterestsIndex).toBe(false);
    });

    it('Note collection has strictly required indexes only', async () => {
      const indexes = await Note.collection.indexes();
      const indexNames = indexes.map((idx) => idx.name).sort();

      // Required: default _id_, createdAt_-1__id_-1 (admin sort), userId_1_createdAt_-1__id_-1 (user note list)
      expect(indexNames).toEqual([
        '_id_',
        'createdAt_-1__id_-1',
        'userId_1_createdAt_-1__id_-1',
      ]);
    });

    it('Post collection has strictly required indexes only', async () => {
      const indexes = await Post.collection.indexes();
      const indexNames = indexes.map((idx) => idx.name).sort();

      // Required: default _id_, userId_1_createdAt_-1__id_-1 (lookup + sort)
      expect(indexNames).toEqual(['_id_', 'userId_1_createdAt_-1__id_-1']);
    });
  });

  describe('Execution Plan Verification (IXSCAN vs COLLSCAN)', () => {
    function findStage(plan: any, stageName: string): any {
      if (!plan) return null;
      if (plan.stage === stageName) return plan;
      if (plan.inputStage) {
        const found = findStage(plan.inputStage, stageName);
        if (found) return found;
      }
      if (plan.inputStages) {
        for (const input of plan.inputStages) {
          const found = findStage(input, stageName);
          if (found) return found;
        }
      }
      return null;
    }

    it('User note listing query utilizes IXSCAN on compound index', async () => {
      const sampleUserId = new mongoose.Types.ObjectId();
      const explain: any = await Note.find({ userId: sampleUserId })
        .sort({ createdAt: -1, _id: -1 })
        .limit(10)
        .explain('executionStats');

      const ixscan = findStage(explain.queryPlanner.winningPlan, 'IXSCAN');
      expect(ixscan).toBeDefined();
      expect(ixscan.indexName).toBe('userId_1_createdAt_-1__id_-1');
    });

    it('Admin note listing query utilizes IXSCAN on createdAt tie-breaker index', async () => {
      const explain: any = await Note.find()
        .sort({ createdAt: -1, _id: -1 })
        .limit(10)
        .explain('executionStats');

      const ixscan = findStage(explain.queryPlanner.winningPlan, 'IXSCAN');
      expect(ixscan).toBeDefined();
      expect(ixscan.indexName).toBe('createdAt_-1__id_-1');
    });

    it('User posts listing query utilizes IXSCAN on userId tie-breaker index', async () => {
      const sampleUserId = new mongoose.Types.ObjectId();
      const explain: any = await Post.find({ userId: sampleUserId })
        .sort({ createdAt: -1, _id: -1 })
        .limit(10)
        .explain('executionStats');

      const ixscan = findStage(explain.queryPlanner.winningPlan, 'IXSCAN');
      expect(ixscan).toBeDefined();
      expect(ixscan.indexName).toBe('userId_1_createdAt_-1__id_-1');
    });
  });
});
