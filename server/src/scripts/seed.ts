import { connectDB, disconnectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Note } from "../models/Note.js";
import { Post } from "../models/Post.js";

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB Atlas for database seeding...");
    await connectDB();

    console.log("Synchronizing schema indexes...");
    await Promise.all([
      User.syncIndexes(),
      Note.syncIndexes(),
      Post.syncIndexes(),
    ]);

    // Clean existing seed data
    console.log("Cleaning old seed data...");

    const seedEmails = [
      "admin@notely.com",
      "alice@notely.com",
      "bob@notely.com",
      "charlie@notely.com",
    ];

    const existingUsers = await User.find({
      email: { $in: seedEmails },
    });

    const existingUserIds = existingUsers.map((u) => u._id);

    await Promise.all([
      Note.deleteMany({ userId: { $in: existingUserIds } }),
      Post.deleteMany({ userId: { $in: existingUserIds } }),
      User.deleteMany({ email: { $in: seedEmails } }),
    ]);

    console.log("Creating users...");

    // Admin account (seed only)
    const admin = await User.create({
      name: "System Admin",
      email: "admin@notely.com",
      password: "admin123",
      role: "admin",
      interests: ["management", "security", "cloud"],
    });

    const alice = await User.create({
      name: "Alice Cooper",
      email: "alice@notely.com",
      password: "user123",
      role: "user",
      interests: ["chess", "reading"],
    });

    const bob = await User.create({
      name: "Bob Marley",
      email: "bob@notely.com",
      password: "user123",
      role: "user",
      interests: ["reading", "coding"],
    });

    const charlie = await User.create({
      name: "Charlie Brown",
      email: "charlie@notely.com",
      password: "user123",
      role: "user",
      interests: ["chess", "gaming"],
    });

    const users = [admin, alice, bob, charlie];

    // Existing notes
    console.log("Creating notes...");

    const initialNotes = [
      {
        title: "Alice's Private Note on Books",
        content: "Review of clean architecture principles and patterns.",
        userId: alice._id,
      },
      {
        title: "Alice's Chess Tactics",
        content: "Focus on endgame techniques and pawn structure.",
        userId: alice._id,
      },
      {
        title: "Weekly Groceries List",
        content: "Oat milk, coffee beans, dark chocolate.",
        userId: alice._id,
      },
      {
        title: "Bob's Project Roadmap",
        content: "Implement aggregation pipelines and indexing benchmarks.",
        userId: bob._id,
      },
      {
        title: "Typescript Tips",
        content: "Use discriminative unions for strict domain modeling.",
        userId: bob._id,
      },
      {
        title: "Charlie's Game Strategy",
        content: "Opening repertoire for tournament preparation.",
        userId: charlie._id,
      },
      {
        title: "Admin Infrastructure Note",
        content:
          "Atlas cluster latency monitored; index utilization validated.",
        userId: admin._id,
      },
    ];

    // Generate additional notes for pagination testing
    const noteTopics = [
      "MongoDB Indexing",
      "TypeScript Best Practices",
      "Node.js Performance",
      "REST API Design",
      "Database Optimization",
      "Clean Architecture",
      "Software Testing",
      "Authentication Strategies",
      "Redis Caching",
      "Microservices Design",
      "System Design",
      "API Security",
      "React Performance",
      "Distributed Systems",
      "Cloud Infrastructure",
    ];

    const generatedNotes = Array.from({ length: 40 }, (_, i) => {
      const user = users[i % users.length];
      const topic = noteTopics[i % noteTopics.length];

      return {
        title: `${topic} - Research Note ${i + 1}`,
        content: `This is generated test note ${i + 1}. 
          Exploring ${topic.toLowerCase()} with practical examples, 
          implementation strategies, performance considerations, 
          and production-ready approaches.`,
        userId: user._id,
      };
    });

    await Note.insertMany([...initialNotes, ...generatedNotes]);

    // Existing public posts
    console.log("Creating public posts...");

    const initialPosts = [
      {
        title: "Why Chess Improves Problem Solving",
        content:
          "Deep work and tactical calculation translate directly to software design.",
        userId: alice._id,
      },
      {
        title: "My Favorite 2026 Books",
        content: "A curated list of engineering and leadership books.",
        userId: alice._id,
      },
      {
        title: "Understanding MongoDB Aggregation Pipelines",
        content:
          "Explaining $unwind, $group, and $lookup with real data pipelines.",
        userId: bob._id,
      },
      {
        title: "Mastering TypeScript Generics",
        content: "Practical patterns for production applications.",
        userId: bob._id,
      },
      {
        title: "Building Scalable APIs",
        content: "Pagination tie-breakers and query optimization strategies.",
        userId: bob._id,
      },
      {
        title: "Board Game Night Highlights",
        content: "Recap of our weekend chess and strategy matches.",
        userId: charlie._id,
      },
    ];

    // Generate additional public posts
    const postTopics = [
      "Understanding MongoDB Aggregation",
      "Building Scalable Node.js APIs",
      "TypeScript Advanced Patterns",
      "Database Index Optimization",
      "REST API Pagination",
      "JWT Authentication Best Practices",
      "Clean Code Principles",
      "Microservices Communication",
      "Redis Caching Strategies",
      "Event-Driven Architecture",
      "Designing Reliable APIs",
      "MongoDB Lookup Explained",
      "Backend Performance Optimization",
      "Testing Express Applications",
      "Secure Password Management",
      "PostgreSQL vs MongoDB",
      "Distributed System Fundamentals",
      "Docker for Developers",
      "Building Production Applications",
      "Software Engineering Lessons",
    ];

    const generatedPosts = Array.from({ length: 40 }, (_, i) => {
      const user = users[(i % 3) + 1]; // Alice, Bob, Charlie
      const topic = postTopics[i % postTopics.length];

      return {
        title: `${topic} - Part ${i + 1}`,
        content: `In this article, we explore ${topic.toLowerCase()}.
          This is generated public post ${i + 1}, covering practical 
          implementation details, real-world examples, common mistakes, 
          and production engineering recommendations.`,
        userId: user._id,
      };
    });

    await Post.insertMany([...initialPosts, ...generatedPosts]);

    console.log(
      "\n================ SEED COMPLETED SUCCESSFULLY ================",
    );
    console.log("Seed Accounts:");
    console.log("  Admin  : admin@notely.com / admin123");
    console.log("  Alice  : alice@notely.com / user123");
    console.log("  Bob    : bob@notely.com / user123");
    console.log("  Charlie: charlie@notely.com / user123");

    console.log("\nSeed Statistics:");
    console.log(`  Users: ${users.length}`);
    console.log(`  Notes: ${initialNotes.length + generatedNotes.length}`);
    console.log(`  Posts: ${initialPosts.length + generatedPosts.length}`);
    console.log(
      "==============================================================\n",
    );
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

seedDatabase();
