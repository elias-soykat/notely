import { app } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { config } from './config/env.js';

async function startServer() {
  try {
    await connectDB();
    console.log(`Connected to MongoDB Atlas [${config.nodeEnv}]`);

    const server = app.listen(config.port, () => {
      console.log(`Notely API Server listening on port ${config.port}`);
    });

    const shutdown = (signal: string) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        try {
          await disconnectDB();
          console.log('Database connection closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error during database disconnect:', err);
          process.exit(1);
        }
      });

      // Force close if graceful shutdown takes too long
      setTimeout(() => {
        console.error('Graceful shutdown timed out, force terminating.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
