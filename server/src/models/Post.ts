import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content: string;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Explicit schema index (strictly required only)
// Supports retrieving user posts, deterministic tie-breaker sorting, and foreignField matching in $lookup
PostSchema.index({ userId: 1, createdAt: -1, _id: -1 });

export const Post: Model<IPost> = mongoose.model<IPost>('Post', PostSchema);
