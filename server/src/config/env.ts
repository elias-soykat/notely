import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret && nodeEnv !== 'test') {
  throw new Error('FATAL: JWT_SECRET environment variable is missing.');
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  mongoUri: nodeEnv === 'test'
    ? (process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || '')
    : (process.env.MONGODB_URI || ''),
  jwtSecret: jwtSecret || 'test_jwt_secret_only_for_automated_testing_key_12345',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
};
