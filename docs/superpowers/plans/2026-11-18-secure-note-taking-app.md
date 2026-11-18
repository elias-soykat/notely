# Secure Note-Taking Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure, production-grade TypeScript REST API and functional frontend using Express, MongoDB Atlas / Mongoose with strictly required schema indexes (including `_id` tie-breakers), JWT authentication, role-based access control (User and Admin), pagination for all list operations, and two dedicated MongoDB aggregation pipelines.

**Architecture:** Layered TypeScript backend (`server/`) with Express containing Mongoose models with explicit `schema.index()` definitions, JWT authentication, role-based access control middleware, paginated controllers, and single-pipeline aggregation endpoints connecting directly to MongoDB Atlas. A lightweight Vite + React TypeScript client (`client/`) provides functional UI for authentication, note CRUD, admin user management, and aggregation results.

**Tech Stack:** TypeScript, Node.js, Express, MongoDB Atlas with Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, Vitest, Supertest, Vite + React, pnpm.

**Spec:** `c:\Users\Elias\elias\notely\Backend Task Requirements.md`

## Global Constraints

- **Language:** TypeScript (the project must be written in TypeScript).
- **Database:** MongoDB Atlas (cloud-hosted MongoDB) with Mongoose only. No local MongoDB or in-memory database.
- **Authentication:** JWT (JSON Web Tokens).
- **Security:** Implement secure password hashing with bcrypt. Public registration must always assign `role: 'user'`. Admin accounts are created strictly via seed script.
- **Package Manager:** pnpm.
- **Indexing visibility:** You must use the `schema.index` method for defining indexes in your code so they are visible during review.
- **Strict indexing constraint:** DO NOT MAKE ANY UNNECESSARY INDEXES. You will be evaluated on the efficiency of your indexing strategy. Only create indexes strictly required to support the queries, paginated tie-breakers, and aggregations. (No `{ interests: 1 }` index).
- **Tie-breaker indexing:**
  - User: `{ createdAt: -1, _id: -1 }`
  - Note: `{ userId: 1, createdAt: -1, _id: -1 }` and `{ createdAt: -1, _id: -1 }`
  - Post: `{ userId: 1, createdAt: -1, _id: -1 }`
- **Aggregation constraint 1:** Scenario 1 (Group by Interests) must use exactly one `collection.aggregate()` call on `User`. Do not use any other methods.
- **Aggregation constraint 2:** Scenario 2 (User Posts) must use a single `User.aggregate()` pipeline beginning with `$match: { _id: userId }`, followed by `$lookup` to retrieve posts, applying sorting and pagination inside the lookup pipeline.
- **Frontend constraint:** DO NOT USE ANY TEMPLATES. DO NOT waste time improving the frontend. This is a backend task.

## Review Focus

1. Unauthenticated requests to protected endpoints return `401 Unauthorized` with a structured error payload.
2. Regular `user` role attempting to edit or delete another user's note or access `/api/admin/*` endpoints returns `403 Forbidden`.
3. Public registration payload containing `{ role: 'admin' }` is ignored/sanitized so the registered user is strictly `user`.
4. Pagination sorting produces deterministic results using compound sorting `[createdAt: -1, _id: -1]`.
5. User Posts aggregation uses one `User.aggregate()` pipeline with `$lookup` sub-pipeline sorting by `{ createdAt: -1, _id: -1 }` and paginating inside `$lookup`.

---

### Task 1: Project Scaffolding & Workspace Setup

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `.gitignore`

**Interfaces:**
- Consumes: None
- Produces: Root pnpm workspace with `server` and `client` packages configured for TypeScript.

- [ ] **Step 1: Write root and server configuration files**
Create `pnpm-workspace.yaml` declaring `packages: ['server', 'client']`, root `package.json` with scripts (`build`, `dev`, `test`, `seed`), and `server/tsconfig.json` targeting ES2022 with NodeNext/CommonJS module resolution.

- [ ] **Step 2: Install dependencies using pnpm**
Install dependencies with `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `dotenv`, `cors`, and devDependencies `@types/express`, `@types/node`, `@types/jsonwebtoken`, `@types/bcryptjs`, `@types/supertest`, `supertest`, `vitest`, `tsx`. (Strictly no `mongodb-memory-server`).

- [ ] **Step 3: Run sanity test script**
Run: `pnpm --filter server exec vitest --version`
Expected: PASS with Vitest version output.

- [ ] **Step 4: Commit**
```bash
git add package.json pnpm-workspace.yaml server/ client/ .gitignore
git commit -m "chore: scaffold pnpm workspace for server and client"
```

---

### Task 2: MongoDB Atlas Database Connection & Environment Config

**Files:**
- Create: `server/src/config/env.ts`
- Create: `server/src/config/db.ts`
- Create: `server/.env.example`
- Test: `server/tests/db.test.ts`

**Interfaces:**
- Consumes: `MONGODB_URI` (or `TEST_MONGODB_URI` for test suite) from `.env`.
- Produces: `connectDB(uri?: string): Promise<typeof mongoose>`, `disconnectDB(): Promise<void>`, `config` object.

- [ ] **Step 1: Write failing database connection test**
```typescript
import { connectDB, disconnectDB } from '../src/config/db';
import mongoose from 'mongoose';

describe('Database Connection', () => {
  afterEach(async () => {
    await disconnectDB();
  });

  it('connects to mongoose successfully with valid URI', async () => {
    const conn = await connectDB();
    expect(mongoose.connection.readyState).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm --filter server test tests/db.test.ts`
Expected: FAIL with "Cannot find module '../src/config/db'"

- [ ] **Step 3: Implement `server/src/config/env.ts` and `server/src/config/db.ts`**
Read environment variables safely from `.env` using `dotenv`, connecting to MongoDB Atlas.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm --filter server test tests/db.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add server/src/config/ server/tests/db.test.ts server/.env.example
git commit -m "feat(server): add MongoDB Atlas connection and configuration module"
```

---

### Task 3: User Model with Strict Indexing & Password Hashing

**Files:**
- Create: `server/src/models/User.ts`
- Test: `server/tests/models/user.model.test.ts`

**Interfaces:**
- Consumes: `mongoose.Schema`, `bcryptjs`
- Produces: `IUser` interface, `User` mongoose model with:
  - Fields: `name: string`, `email: string`, `password: string`, `role: 'user' | 'admin'`, `interests: string[]`, `createdAt: Date`, `updatedAt: Date`.
  - Methods: `comparePassword(candidate: string): Promise<boolean>`.
  - Indexes (Strictly required only):
    - `schema.index({ email: 1 }, { unique: true })`
    - `schema.index({ createdAt: -1, _id: -1 })` (deterministic pagination tie-breaker)
    - Note: No `{ interests: 1 }` index (unnecessary for `$unwind` -> `$group` -> `$sort`).
    - Note: No manual `schema.index({ _id: 1 })`.

- [ ] **Step 1: Write failing tests for User model**
Verify unique email constraint, password hashing before save, `comparePassword` method, and exact schema indexes matching `{ email: 1 }` and `{ createdAt: -1, _id: -1 }`.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm --filter server test tests/models/user.model.test.ts`
Expected: FAIL with "Cannot find module '../src/models/User'"

- [ ] **Step 3: Implement `User` model in `server/src/models/User.ts`**
Define `UserSchema` with explicit `schema.index(...)` calls, pre-save hook for bcrypt hashing (salt rounds: 10), and `comparePassword`.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm --filter server test tests/models/user.model.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add server/src/models/User.ts server/tests/models/user.model.test.ts
git commit -m "feat(server): implement User model with password hashing and deterministic pagination indexes"
```

---

### Task 4: Note Model with Query-Optimized Indexing

**Files:**
- Create: `server/src/models/Note.ts`
- Test: `server/tests/models/note.model.test.ts`

**Interfaces:**
- Consumes: `mongoose.Schema`, `mongoose.Types.ObjectId`
- Produces: `INote` interface, `Note` mongoose model with:
  - Fields: `title: string`, `content: string`, `userId: ObjectId (ref: User)`, `createdAt: Date`, `updatedAt: Date`.
  - Indexes:
    - `schema.index({ userId: 1, createdAt: -1, _id: -1 })` (for user listing their own notes with deterministic tie-breaker).
    - `schema.index({ createdAt: -1, _id: -1 })` (for admin listing everyone's notes with deterministic tie-breaker).
    - No unnecessary indexes.

- [ ] **Step 1: Write failing tests for Note model**
Verify note creation, references, and exact schema indexes matching `{ userId: 1, createdAt: -1, _id: -1 }` and `{ createdAt: -1, _id: -1 }`.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm --filter server test tests/models/note.model.test.ts`
Expected: FAIL with "Cannot find module '../src/models/Note'"

- [ ] **Step 3: Implement `Note` model in `server/src/models/Note.ts`**
Define `NoteSchema` with explicit `schema.index` definitions and timestamps.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm --filter server test tests/models/note.model.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add server/src/models/Note.ts server/tests/models/note.model.test.ts
git commit -m "feat(server): implement Note model with compound user index and tie-breaker sorting"
```

---

### Task 5: Post Model with Lookup-Optimized Indexing

**Files:**
- Create: `server/src/models/Post.ts`
- Test: `server/tests/models/post.model.test.ts`

**Interfaces:**
- Consumes: `mongoose.Schema`, `mongoose.Types.ObjectId`
- Produces: `IPost` interface, `Post` mongoose model with:
  - Fields: `title: string`, `content: string`, `userId: ObjectId (ref: User)`, `createdAt: Date`, `updatedAt: Date`.
  - Indexes:
    - `schema.index({ userId: 1, createdAt: -1, _id: -1 })` (supports user post retrieval with deterministic tie-breaker and foreignField lookup).
    - No unnecessary indexes.

- [ ] **Step 1: Write failing tests for Post model**
Verify post creation, reference to User, and exact schema index `{ userId: 1, createdAt: -1, _id: -1 }`.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm --filter server test tests/models/post.model.test.ts`
Expected: FAIL with "Cannot find module '../src/models/Post'"

- [ ] **Step 3: Implement `Post` model in `server/src/models/Post.ts`**
Define `PostSchema` with `schema.index({ userId: 1, createdAt: -1, _id: -1 })`.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm --filter server test tests/models/post.model.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add server/src/models/Post.ts server/tests/models/post.model.test.ts
git commit -m "feat(server): implement Post model with lookup and tie-breaker index"
```

---

### Task 6: Authentication & Authorization Middleware

**Files:**
- Create: `server/src/middleware/auth.ts`
- Create: `server/src/middleware/rbac.ts`
- Create: `server/src/utils/jwt.ts`
- Test: `server/tests/middleware/auth.test.ts`

**Interfaces:**
- Consumes: `jsonwebtoken`, `IUser`
- Produces:
  - `generateToken(payload: { id: string; role: string; email: string }): string`
  - `verifyToken(token: string): TokenPayload`
  - `authenticate`: Express middleware verifying `Bearer <token>`, attaching `req.user`.
  - `requireRole(...roles: ('user' | 'admin')[])`: Express middleware enforcing RBAC.

- [ ] **Step 1: Write failing tests for auth & RBAC middleware**
Test token generation, valid token acceptance, missing/invalid token rejection with 401, role verification with 403 on forbidden role.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm --filter server test tests/middleware/auth.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `jwt.ts`, `auth.ts`, and `rbac.ts`**
Implement JWT signing/verification, express middleware with proper TypeScript typing augmenting `Express.Request` with `user`.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm --filter server test tests/middleware/auth.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add server/src/middleware/ server/src/utils/ server/tests/middleware/
git commit -m "feat(server): add JWT auth and RBAC middleware"
```

---

### Task 7: Authentication Endpoints with Role Protection

**Files:**
- Create: `server/src/controllers/auth.controller.ts`
- Create: `server/src/routes/auth.routes.ts`
- Create: `server/src/app.ts`
- Test: `server/tests/routes/auth.routes.test.ts`

**Interfaces:**
- Consumes: `User` model, `generateToken`, `authenticate` middleware
- Produces:
  - POST `/api/auth/register` (body: `{ name, email, password, interests? }`) -> ALWAYS assigns `role: 'user'` regardless of body payload.
  - POST `/api/auth/login` (body: `{ email, password }`) -> `{ token, user }`
  - GET `/api/auth/me` (requires Bearer token) -> `{ user }`

- [ ] **Step 1: Write failing tests for Auth routes**
Test register with password hashing, assert sending `{ role: 'admin' }` in registration still assigns `role: 'user'`, test login and me endpoints.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm --filter server test tests/routes/auth.routes.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Auth controller, routes, and express app in `server/src/app.ts`**
Create controllers enforcing strict `user` role assignment on registration, input validation, and proper error responses.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm --filter server test tests/routes/auth.routes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add server/src/controllers/auth.controller.ts server/src/routes/auth.routes.ts server/src/app.ts server/tests/routes/auth.routes.test.ts
git commit -m "feat(server): implement authentication routes with registration role protection"
```

---

### Task 8: Note CRUD & Deterministic Paginated List Operations

**Files:**
- Create: `server/src/utils/pagination.ts`
- Create: `server/src/controllers/note.controller.ts`
- Create: `server/src/routes/note.routes.ts`
- Test: `server/tests/routes/note.routes.test.ts`

**Interfaces:**
- Consumes: `Note` model, `authenticate` middleware
- Produces:
  - POST `/api/notes`: Create note for authenticated user.
  - GET `/api/notes?page=1&limit=10`:
    - If `user`: Lists notes where `userId == req.user.id` sorted by `{ createdAt: -1, _id: -1 }` with pagination metadata (`page`, `limit`, `totalCount`, `totalPages`, `data`).
    - If `admin`: Lists notes from all users sorted by `{ createdAt: -1, _id: -1 }` with pagination metadata.
  - GET `/api/notes/:id`: Fetch specific note (user can only fetch own; admin can fetch any).
  - PUT `/api/notes/:id`: Update note (owner only).
  - DELETE `/api/notes/:id`: Delete note (owner or admin).

- [ ] **Step 1: Write failing tests for Note routes with RBAC & Deterministic Pagination**
Assert regular users only see and edit their own notes; assert pagination metadata is accurate and sorts by `{ createdAt: -1, _id: -1 }`; assert admin can see everyone's notes.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm --filter server test tests/routes/note.routes.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement pagination utility, Note controller, and routes**
Implement sanitized pagination parsing, `{ createdAt: -1, _id: -1 }` sorting, ownership verification, and query execution.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm --filter server test tests/routes/note.routes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add server/src/utils/pagination.ts server/src/controllers/note.controller.ts server/src/routes/note.routes.ts server/tests/routes/note.routes.test.ts
git commit -m "feat(server): implement note CRUD and deterministic paginated list operations with RBAC"
```

---

### Task 9: Admin User Management Endpoints

**Files:**
- Create: `server/src/controllers/admin.controller.ts`
- Create: `server/src/routes/admin.routes.ts`
- Test: `server/tests/routes/admin.routes.test.ts`

**Interfaces:**
- Consumes: `User` model, `authenticate`, `requireRole('admin')`
- Produces:
  - GET `/api/admin/users?page=1&limit=10`: Paginated list of users sorted by `{ createdAt: -1, _id: -1 }`.
  - POST `/api/admin/users`: Admin creates user (can set role).
  - PUT `/api/admin/users/:id`: Admin updates user (role, name, interests).
  - DELETE `/api/admin/users/:id`: Admin deletes user.

- [ ] **Step 1: Write failing tests for Admin user management**
Test access rejection for standard `user` role (403), paginated user list sorted by `{ createdAt: -1, _id: -1 }` for admin, create, update, delete user.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm --filter server test tests/routes/admin.routes.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Admin controller and routes**
Implement handlers enforcing admin role check, paginated listing with tie-breaker, and validation.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm --filter server test tests/routes/admin.routes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add server/src/controllers/admin.controller.ts server/src/routes/admin.routes.ts server/tests/routes/admin.routes.test.ts
git commit -m "feat(server): implement admin user management with deterministic paginated list"
```

---

### Task 10: Aggregation Pipeline 1 - Group by Interests

**Files:**
- Create: `server/src/controllers/aggregation.controller.ts`
- Create: `server/src/routes/aggregation.routes.ts`
- Test: `server/tests/aggregations/interests.aggregation.test.ts`

**Interfaces:**
- Consumes: `User` model
- Produces:
  - GET `/api/aggregations/users-by-interests`: Executes exactly ONE `User.aggregate()` call grouping users by interest.
  - Pipeline stages:
    1. `$unwind: "$interests"`
    2. `$group: { _id: "$interests", count: { $sum: 1 }, users: { $push: { _id: "$_id", name: "$name", email: "$email" } } }`
    3. `$sort: { count: -1, _id: 1 }`

- [ ] **Step 1: Write failing test for Group by Interests aggregation**
Seed users with diverse interests (`['chess', 'reading']`, `['reading', 'coding']`), execute endpoint, verify output groups interests with users and counts, and assert exactly one `User.aggregate()` call was executed.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm --filter server test tests/aggregations/interests.aggregation.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Group by Interests aggregation handler in `aggregation.controller.ts`**
Write single `User.aggregate()` pipeline, handling empty interests safely.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm --filter server test tests/aggregations/interests.aggregation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add server/src/controllers/aggregation.controller.ts server/src/routes/aggregation.routes.ts server/tests/aggregations/interests.aggregation.test.ts
git commit -m "feat(server): implement single-call aggregation pipeline grouping users by interests"
```

---

### Task 11: Aggregation Pipeline 2 - User Posts with `$lookup` Pipeline

**Files:**
- Modify: `server/src/controllers/aggregation.controller.ts`
- Modify: `server/src/routes/aggregation.routes.ts`
- Create: `server/src/controllers/post.controller.ts`
- Create: `server/src/routes/post.routes.ts`
- Test: `server/tests/aggregations/posts.aggregation.test.ts`

**Interfaces:**
- Consumes: `User` model, `Post` model
- Produces:
  - POST `/api/posts`: Create public post.
  - GET `/api/posts`: Public list of posts (paginated with `{ createdAt: -1, _id: -1 }`).
  - GET `/api/users/:userId/posts?page=1&limit=10`: Single `User.aggregate()` pipeline starting with `$match: { _id: new Types.ObjectId(userId) }` followed by `$lookup` with sub-pipeline sorting and paginating posts.
  - Pipeline stages on `User`:
    1. `$match: { _id: new Types.ObjectId(userId) }`
    2. `$lookup: { from: 'posts', let: { uId: '$_id' }, pipeline: [{ $match: { $expr: { $eq: ['$userId', '$$uId'] } } }, { $sort: { createdAt: -1, _id: -1 } }, { $skip: skip }, { $limit: limit }], as: 'posts' }`
    3. `$project: { _id: 1, name: 1, email: 1, posts: 1 }`

- [ ] **Step 1: Write failing test for User Posts aggregation with `$lookup`**
Seed user and posts, execute `GET /api/users/:userId/posts`, verify retrieved user document contains paginated posts sorted by `{ createdAt: -1, _id: -1 }` via single `User.aggregate()` `$lookup` pipeline.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm --filter server test tests/aggregations/posts.aggregation.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Post controller, routes, and `User.aggregate()` `$lookup` endpoint**
Implement single `$lookup` sub-pipeline on `User` with sorting and pagination.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm --filter server test tests/aggregations/posts.aggregation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add server/src/controllers/post.controller.ts server/src/routes/post.routes.ts server/src/controllers/aggregation.controller.ts server/src/routes/aggregation.routes.ts server/tests/aggregations/posts.aggregation.test.ts
git commit -m "feat(server): implement User.aggregate $lookup pipeline with sorted paginated posts"
```

---

### Task 12: Index Verification & Execution Plan Audit

**Files:**
- Create: `server/tests/indexing.audit.test.ts`

**Interfaces:**
- Consumes: `User`, `Note`, `Post` mongoose models and active MongoDB Atlas connection.
- Produces: Test verifying:
  1. Only strictly required indexes exist:
     - User: `_id_`, `email_1`, `createdAt_-1__id_-1`
     - Note: `_id_`, `userId_1_createdAt_-1__id_-1`, `createdAt_-1__id_-1`
     - Post: `_id_`, `userId_1_createdAt_-1__id_-1`
  2. No redundant index on `interests` or redundant `_id`.
  3. Query `explain('executionStats')` on note list and user posts utilizes `IXSCAN` rather than `COLLSCAN`.

- [ ] **Step 1: Write index audit and explain() tests**
Inspect `listIndexes()` and query execution plans for `IXSCAN`.

- [ ] **Step 2: Run test to verify indexes pass audit**
Run: `pnpm --filter server test tests/indexing.audit.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add server/tests/indexing.audit.test.ts
git commit -m "test(server): add database indexing audit and query execution plan tests"
```

---

### Task 13: Functional Minimal Frontend

**Files:**
- Create: `client/index.html`
- Create: `client/vite.config.ts`
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`
- Create: `client/src/api.ts`
- Create: `client/src/components/AuthView.tsx`
- Create: `client/src/components/NotesView.tsx`
- Create: `client/src/components/AdminView.tsx`
- Create: `client/src/components/AggregationsView.tsx`

**Interfaces:**
- Consumes: REST API (`/api/auth`, `/api/notes`, `/api/admin`, `/api/aggregations`, `/api/posts`)
- Produces: Functional unstyled web app providing UI for:
  - Register & Login (storing JWT in localStorage, toggling user/admin demo accounts).
  - Note CRUD with pagination controls (create, view list with prev/next, edit, delete).
  - Admin view (users list with pagination, user deletion/role edit, view all notes).
  - Aggregations view (Interests aggregation table, User Posts `$lookup` viewer).

- [ ] **Step 1: Implement Vite client configuration and API helper**
Configure Vite proxy to server (`/api` -> `http://localhost:5000`) and typed fetch client with `Authorization: Bearer <token>`.

- [ ] **Step 2: Implement UI views in `client/src/`**
Implement functional components for Auth, Notes CRUD, Admin users panel, and Aggregations viewer.

- [ ] **Step 3: Run client build verification**
Run: `pnpm --filter client build`
Expected: PASS with clean bundle output in `client/dist`.

- [ ] **Step 4: Commit**
```bash
git add client/
git commit -m "feat(client): implement functional unstyled frontend for notes, admin, and aggregations"
```

---

### Task 14: Server Bootstrap, Seed Script & End-to-End Verification

**Files:**
- Create: `server/src/server.ts`
- Create: `server/src/scripts/seed.ts`
- Create: `README.md`

**Interfaces:**
- Consumes: `app.ts`, `connectDB`
- Produces:
  - `pnpm dev`: Runs API server on port 5000 (or `PORT`) and Vite client concurrently.
  - `pnpm seed`: Creates admin account (`admin@example.com` / `admin123`), sample users with interests, notes, and posts.
  - Full test suite running and passing cleanly with `pnpm test`.

- [ ] **Step 1: Implement server bootstrap and seed script**
`server/src/server.ts` connects to DB and listens. `server/src/scripts/seed.ts` creates admin account, sample users, notes, and posts.

- [ ] **Step 2: Run complete automated test suite**
Run: `pnpm --filter server test`
Expected: ALL PASS with 100% test success across all route, model, auth, indexing, and aggregation suites.

- [ ] **Step 3: Write comprehensive `README.md`**
Document architecture, setup instructions (`pnpm install`, `pnpm seed`, `pnpm dev`, `pnpm test`), schema indexing justification table, and aggregation pipeline documentation.

- [ ] **Step 4: Commit**
```bash
git add server/src/server.ts server/src/scripts/seed.ts README.md
git commit -m "feat: complete server bootstrap, seed script, and documentation"
```
