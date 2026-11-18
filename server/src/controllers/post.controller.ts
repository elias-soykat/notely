import { Request, Response } from 'express';
import { Post } from '../models/Post.js';
import { parsePaginationParams, createPaginatedResponse } from '../utils/pagination.js';

export async function createPost(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { title, content } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }

    const post = await Post.create({
      title: title.trim(),
      content,
      userId: req.user.id,
    });

    res.status(201).json({ post });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error creating post' });
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
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching posts' });
  }
}
