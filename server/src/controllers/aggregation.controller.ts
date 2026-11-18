import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { parsePaginationParams } from '../utils/pagination.js';

/**
 * Scenario 1: Group by Interests
 * Constraint: Exactly one collection.aggregate() call. Do not use any other methods.
 */
export async function getUsersByInterests(req: Request, res: Response): Promise<void> {
  try {
    const results = await User.aggregate([
      // Unwind each interest element into individual stream documents
      {
        $unwind: '$interests',
      },
      // Group by the unwound interest string
      {
        $group: {
          _id: '$interests',
          count: { $sum: 1 },
          users: {
            $push: {
              _id: '$_id',
              name: '$name',
              email: '$email',
            },
          },
        },
      },
      // Deterministic sort: highest member count first, then alphabetical interest name
      {
        $sort: { count: -1, _id: 1 },
      },
    ]);

    res.status(200).json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error executing interests aggregation' });
  }
}

/**
 * Scenario 2: User Posts ($lookup)
 * Constraint: Single aggregation pipeline on User beginning with $match on userId,
 * followed by $lookup to retrieve posts with sorting and pagination inside the lookup pipeline.
 */
export async function getUserPosts(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: 'Invalid user ID format' });
      return;
    }

    const { page, limit, skip } = parsePaginationParams(req.query);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const results = await User.aggregate([
      // 1. Begin with $match on user _id
      {
        $match: { _id: userObjectId },
      },
      // 2. $lookup with sub-pipeline for sorting and paginating posts
      {
        $lookup: {
          from: 'posts',
          let: { uId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$userId', '$$uId'] },
              },
            },
            // Sort inside lookup pipeline using deterministic tie-breaker
            {
              $sort: { createdAt: -1, _id: -1 },
            },
            // Pagination inside lookup pipeline
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
          ],
          as: 'posts',
        },
      },
      // 3. Project safe fields
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          interests: 1,
          posts: 1,
          createdAt: 1,
        },
      },
    ]);

    if (!results || results.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json(results[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error executing user posts aggregation' });
  }
}
