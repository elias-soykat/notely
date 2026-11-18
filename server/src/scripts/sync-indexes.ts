import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Note } from '../models/Note.js';
import { Post } from '../models/Post.js';

async function syncAllIndexes() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Synchronizing schema indexes...');
    await Promise.all([
      User.syncIndexes(),
      Note.syncIndexes(),
      Post.syncIndexes(),
    ]);
    console.log('Indexes synchronized successfully.');
    await disconnectDB();
  } catch (error) {
    console.error('Index synchronization failed:', error);
    process.exit(1);
  }
}

syncAllIndexes();
