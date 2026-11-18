import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB(uri?: string): Promise<typeof mongoose> {
  const targetUri = uri || config.mongoUri;
  if (!targetUri) {
    throw new Error(
      'MongoDB connection URI is not defined. Please set MONGODB_URI or TEST_MONGODB_URI in your .env file.'
    );
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(targetUri);
    return conn;
  } catch (error) {
    console.error('Failed to connect to MongoDB Atlas:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
