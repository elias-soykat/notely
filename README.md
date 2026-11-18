# Notely

A full-stack, secure note-taking and user management application built with **TypeScript**, **Node.js/Express**, **React (Vite)**, and **MongoDB**.

---

## Live Deployments

- **Live Frontend Website:** [https://notely-client-eight.vercel.app](https://notely-client-eight.vercel.app)
- **Live Backend REST API:** [https://api-production-54abc6c2.up.railway.app](https://api-production-54abc6c2.up.railway.app)
- **API Health Check:** [https://api-production-54abc6c2.up.railway.app/api/health](https://api-production-54abc6c2.up.railway.app/api/health)

---

## Features

- **Authentication & RBAC:** Secure JWT authentication with role-based access control (`user` and `admin`).
- **Notes Management:** Create, view, update, and delete personal notes with deterministic pagination.
- **Admin Dashboard:** Administrative user management (CRUD) and global note inspection.
- **Data Aggregations:** MongoDB aggregation pipelines for grouping users by interests and loading posts via `$lookup`.
- **Optimized Indexing:** Compound indexes on MongoDB collections for high-performance sorting and querying.

---

## Quick Start (First-Time Setup)

### Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher)
- A **MongoDB** database (MongoDB Atlas connection string or local MongoDB instance)

### 1. Install Dependencies

Install packages across the entire workspace from the project root:

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root (or inside `server/`) based on `.env.example`:

```bash
cp .env.example .env
```

Ensure your `.env` contains valid values for your MongoDB database and JWT secret:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/notely?retryWrites=true&w=majority
TEST_MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/notely_test?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
JWT_EXPIRES_IN=1d
```

### 3. Seed the Database

Populate the database with sample users, notes, and posts:

```bash
pnpm seed
```

### 4. Start the Application

Start both the backend API and frontend client concurrently:

```bash
pnpm dev
```

- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## Seed Accounts & Credentials

The seed script (`pnpm seed`) initializes the following accounts:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@notely.com` | `admin123` | Full access: user management, global notes |
| **User** | `alice@notely.com` | `user123` | Standard user: personal notes |
| **User** | `bob@notely.com` | `user123` | Standard user: personal notes |
| **User** | `charlie@notely.com` | `user123` | Standard user: personal notes |

> **Note:** Public registration (`POST /api/auth/register`) automatically assigns the `user` role. Admin accounts must be created by an existing administrator or via the seed script.

---

## Available Scripts

Run these commands from the project root:

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts both backend and frontend development servers concurrently |
| `pnpm build` | Builds both backend (`tsc`) and frontend (`vite build`) for production |
| `pnpm test` | Runs the automated backend test suite via Vitest |
| `pnpm seed` | Seeds the database with default test accounts, notes, and posts |
| `pnpm --filter server sync-indexes` | Synchronizes declared Mongoose schema indexes with MongoDB |

---

## Project Structure

```text
notely/
├── client/                     # Frontend Vite + React SPA
│   ├── src/
│   │   ├── components/         # Auth, Notes, Admin, & Aggregations views
│   │   ├── api.ts              # API client helper
│   │   ├── App.tsx             # Root application component
│   │   └── main.tsx            # Entry point
│   └── vite.config.ts          # Vite configuration & /api proxy to port 5000
│
├── server/                     # Backend Express REST API
│   ├── src/
│   │   ├── config/             # Database connection and environment config
│   │   ├── controllers/        # Route controllers & business logic
│   │   ├── middleware/         # Auth (JWT), RBAC, rate-limiting, and validation
│   │   ├── models/             # Mongoose schemas with compound indexes
│   │   ├── routes/             # Express route definitions
│   │   ├── schemas/            # Zod validation schemas
│   │   └── scripts/            # Seed and index sync scripts
│   └── tests/                  # Unit and integration test suites (Vitest)
│
├── .env.example                # Example environment variables
├── package.json                # Monorepo scripts and workspace config
└── pnpm-workspace.yaml         # pnpm workspace definition
```

---

## API Overview

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a new user (`user` role)
- `POST /api/auth/login` - Authenticate and obtain JWT token
- `GET /api/auth/profile` - Fetch authenticated user profile

### Notes (`/api/notes`)
- `GET /api/notes?page=1&limit=10` - List user's notes (paginated)
- `POST /api/notes` - Create a note
- `GET /api/notes/:id` - Get a note by ID
- `PUT /api/notes/:id` - Update a note
- `DELETE /api/notes/:id` - Delete a note

### Admin (`/api/admin`) *(Admin role required)*
- `GET /api/admin/users` - List all registered users
- `POST /api/admin/users` - Create a new user (can assign roles)
- `PUT /api/admin/users/:id` - Update user details or role
- `DELETE /api/admin/users/:id` - Delete a user

### Aggregations & Posts
- `GET /api/aggregations/users-by-interests` - Group users by interests with user counts
- `GET /api/users/:userId/posts?page=1&limit=10` - Retrieve user posts via `$lookup` pipeline
- `GET /api/posts` - List all public posts
