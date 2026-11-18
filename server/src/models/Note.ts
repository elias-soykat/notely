import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface INote extends Document {
  title: string;
  content: string;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
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

// Explicit schema indexes (strictly required only)
// 1. Supports user listing their own notes with deterministic tie-breaker sorting
NoteSchema.index({ userId: 1, createdAt: -1, _id: -1 });

// 2. Supports admin listing all notes across all users with deterministic tie-breaker sorting
NoteSchema.index({ createdAt: -1, _id: -1 });

export const Note: Model<INote> = mongoose.model<INote>('Note', NoteSchema);
