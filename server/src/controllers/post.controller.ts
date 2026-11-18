import { Request, Response } from 'express';
import { Post } from '../models/Post.js';
import { parsePaginationParams, createPaginatedResponse } from '../utils/pagination.js';
import { getErrorMessage } from '../utils/errors.js';

export async function createPost(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { title, content } = req.body;

    const post = await Post.create({
      title: title.trim(),
      content,
      userId: req.user.id,
    });

    res.status(201).json({ post });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}

export async function getPosts(req: Request, res: Response): Promise<void> {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);

    const [totalCount, posts] = await Promise.all([
      Post.countDocuments(),
      Post.find()
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json(createPaginatedResponse(posts, totalCount, page, limit));
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}
