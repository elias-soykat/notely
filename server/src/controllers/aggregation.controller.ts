import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { parsePaginationParams } from '../utils/pagination.js';
import { getErrorMessage } from '../utils/errors.js';

export async function getUsersByInterests(req: Request, res: Response): Promise<void> {
  try {
    const results = await User.aggregate([
      { $unwind: '$interests' },
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
      { $sort: { count: -1, _id: 1 } },
    ]);

    res.status(200).json(results);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

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
      { $match: { _id: userObjectId } },
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
            { $sort: { createdAt: -1, _id: -1 } },
          ],
          as: 'allPosts',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          interests: 1,
          createdAt: 1,
          totalCount: { $size: '$allPosts' },
          posts: { $slice: ['$allPosts', skip, limit] },
        },
      },
    ]);

    if (!results || results.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userDoc = results[0];
    const totalCount = typeof userDoc.totalCount === 'number' ? userDoc.totalCount : 0;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    res.status(200).json({
      ...userDoc,
      page,
      limit,
      totalCount,
      totalPages,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}
