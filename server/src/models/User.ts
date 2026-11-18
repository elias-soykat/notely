import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    interests: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Explicit schema indexes (strictly required only, using schema.index as specified)
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ createdAt: -1, _id: -1 });

// Helper to normalize interests: trim, lowercase, remove empty, and deduplicate
export function normalizeInterests(interests: any): string[] {
  if (!Array.isArray(interests)) return [];
  return Array.from(
    new Set(
      interests
        .map((i) => (typeof i === 'string' ? i.trim().toLowerCase() : ''))
        .filter(Boolean)
    )
  );
}

// Pre-save hook: normalizes interests and hashes password
UserSchema.pre<IUser>('save', async function (next) {
  if (this.interests && Array.isArray(this.interests)) {
    this.interests = normalizeInterests(this.interests);
  }

  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
