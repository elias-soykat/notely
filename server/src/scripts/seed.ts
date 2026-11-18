import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Note } from '../models/Note.js';
import { Post } from '../models/Post.js';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas for database seeding...');
    await connectDB();

    console.log('Synchronizing schema indexes...');
    await Promise.all([
      User.syncIndexes(),
      Note.syncIndexes(),
      Post.syncIndexes(),
    ]);

    // Clean existing seed data
    console.log('Cleaning old seed data...');
    const seedEmails = [
      'admin@notely.com',
      'alice@notely.com',
      'bob@notely.com',
      'charlie@notely.com',
    ];
    const existingUsers = await User.find({ email: { $in: seedEmails } });
    const existingUserIds = existingUsers.map((u) => u._id);

    await Promise.all([
      Note.deleteMany({ userId: { $in: existingUserIds } }),
      Post.deleteMany({ userId: { $in: existingUserIds } }),
      User.deleteMany({ email: { $in: seedEmails } }),
    ]);

    console.log('Creating users...');
    // Admin account (created strictly through seed, NOT public registration)
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@notely.com',
      password: 'admin123',
      role: 'admin',
      interests: ['management', 'security', 'cloud'],
    });

    const alice = await User.create({
      name: 'Alice Cooper',
      email: 'alice@notely.com',
      password: 'user123',
      role: 'user',
      interests: ['chess', 'reading'],
    });

    const bob = await User.create({
      name: 'Bob Marley',
      email: 'bob@notely.com',
      password: 'user123',
      role: 'user',
      interests: ['reading', 'coding'],
    });

    const charlie = await User.create({
      name: 'Charlie Brown',
      email: 'charlie@notely.com',
      password: 'user123',
      role: 'user',
      interests: ['chess', 'gaming'],
    });

    console.log('Creating notes...');
    await Note.create([
      {
        title: "Alice's Private Note on Books",
        content: 'Review of clean architecture principles and patterns.',
        userId: alice._id,
      },
      {
        title: "Alice's Chess Tactics",
        content: 'Focus on endgame techniques and pawn structure.',
        userId: alice._id,
      },
      {
        title: 'Weekly Groceries List',
        content: 'Oat milk, coffee beans, dark chocolate.',
        userId: alice._id,
      },
      {
        title: "Bob's Project Roadmap",
        content: 'Implement aggregation pipelines and indexing benchmarks.',
        userId: bob._id,
      },
      {
        title: 'Typescript Tips',
        content: 'Use discriminative unions for strict domain modeling.',
        userId: bob._id,
      },
      {
        title: "Charlie's Game Strategy",
        content: 'Opening repertoire for tournament preparation.',
        userId: charlie._id,
      },
      {
        title: 'Admin Infrastructure Note',
        content: 'Atlas cluster latency monitored; index utilization validated.',
        userId: admin._id,
      },
    ]);

    console.log('Creating public posts...');
    await Post.create([
      {
        title: 'Why Chess Improves Problem Solving',
        content: 'Deep work and tactical calculation translate directly to software design.',
        userId: alice._id,
      },
      {
        title: 'My Favorite 2026 Books',
        content: 'A curated list of engineering and leadership books.',
        userId: alice._id,
      },
      {
        title: 'Understanding MongoDB Aggregation Pipelines',
        content: 'Explaining $unwind, $group, and $lookup with real data pipelines.',
        userId: bob._id,
      },
      {
        title: 'Mastering TypeScript Generics',
        content: 'Practical patterns for production applications.',
        userId: bob._id,
      },
      {
        title: 'Building Scalable APIs',
        content: 'Pagination tie-breakers and query optimization strategies.',
        userId: bob._id,
      },
      {
        title: 'Board Game Night Highlights',
        content: 'Recap of our weekend chess and strategy matches.',
        userId: charlie._id,
      },
    ]);

    console.log('\n================ SEED COMPLETED SUCCESSFULLY ================');
    console.log('Seed Accounts:');
    console.log('  Admin User : admin@notely.com / admin123  (Role: admin)');
    console.log('  Standard 1 : alice@notely.com / user123  (Role: user, Interests: chess, reading)');
    console.log('  Standard 2 : bob@notely.com   / user123  (Role: user, Interests: reading, coding)');
    console.log('  Standard 3 : charlie@notely.com / user123 (Role: user, Interests: chess, gaming)');
    console.log('==============================================================\n');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

seedDatabase();
