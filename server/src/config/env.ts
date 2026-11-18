import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory first, fallback to root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.NODE_ENV === 'test'
    ? (process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || '')
    : (process.env.MONGODB_URI || ''),
  jwtSecret: process.env.JWT_SECRET || 'notely_secure_jwt_secret_key_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
};
