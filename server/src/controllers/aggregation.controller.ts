import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

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
