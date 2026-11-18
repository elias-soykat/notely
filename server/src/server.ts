import { app } from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';
import { User } from './models/User.js';
import { Note } from './models/Note.js';
import { Post } from './models/Post.js';

async function startServer() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await connectDB();
    console.log('Connected to MongoDB Atlas successfully.');

    // Ensure strictly required schema indexes are initialized
    console.log('Synchronizing database schema indexes...');
    await Promise.all([
      User.syncIndexes(),
      Note.syncIndexes(),
      Post.syncIndexes(),
    ]);
    console.log('Database indexes synchronized.');

    app.listen(config.port, () => {
      console.log(`Notely API Server running on port ${config.port} [${config.nodeEnv}]`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
