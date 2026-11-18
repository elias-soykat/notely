# Notely - Secure Note-Taking Application

A secure, optimized REST API and functional web application built in **TypeScript** using **Express**, **MongoDB Atlas**, **Mongoose**, **JWT Authentication**, and **pnpm**, adhering strictly to the constraints outlined in [Backend Task Requirements.md](./Backend%20Task%20Requirements.md).

---

## 1. Overview & Architecture

- **Backend:** Express REST API with TypeScript in `server/`, architected with strict layering:
  - `src/models/`: Mongoose schemas declaring explicit indexes using `schema.index(...)` without redundant indexes.
  - `src/middleware/`: JWT verification (`authenticate`) and role-based access control (`requireRole`).
  - `src/controllers/`: Business logic handling pagination, authorization, and aggregation pipelines.
  - `src/routes/`: Route declarations mounted at `/api/auth`, `/api/notes`, `/api/admin`, `/api/posts`, `/api/users`, and `/api/aggregations`.
- **Frontend:** Lightweight, unstyled Vite + React SPA in `client/` built strictly for functionality and integration (auth token persistence, note CRUD with pagination, admin user management, and aggregation visualizations).
- **Database:** Cloud-hosted MongoDB Atlas.

---

## 2. Roles & Permissions (RBAC)

| Role | Permissions |
| :--- | :--- |
| **User** | Create, view, update, and delete their own notes; view public posts; view profile. |
| **Admin** | Inherits all User capabilities; can view everyone's notes; can manage users (list, create, update roles/details, delete). |

> **Security Note on Registration:** Public registration via `POST /api/auth/register` **strictly assigns the `user` role**. Admin accounts cannot be self-registered and are created exclusively via the administrative seed script or by an existing admin.

---

## 3. Database Indexing Strategy (`schema.index`)

Per the core requirement to create **only strictly required indexes** and define them via `schema.index`:

| Collection | Declared Index (`schema.index`) | Purpose | Optimization Details |
| :--- | :--- | :--- | :--- |
| **User** | `{ email: 1 }` (unique) | Unique login & email search | Enforces uniqueness and speeds up `findOne({ email })`. |
| **User** | `{ createdAt: -1, _id: -1 }` | Admin user listing | Supports descending date sort with `_id` deterministic tie-breaker for pagination. |
| **Note** | `{ userId: 1, createdAt: -1, _id: -1 }` | User note listing | Equality filter on `userId` combined with compound descending sort on `createdAt` and `_id`. |
| **Note** | `{ createdAt: -1, _id: -1 }` | Admin viewing all notes | Supports global descending date sort with `_id` tie-breaker. |
| **Post** | `{ userId: 1, createdAt: -1, _id: -1 }` | User posts retrieval & `$lookup` | Supports filtering by `userId`, `$lookup` foreignField matching, and tie-breaker sorting. |
| **Post** | `{ createdAt: -1, _id: -1 }` | Public posts listing | Supports global descending date sort with `_id` tie-breaker. |

### Unnecessary Indexes Intentionally Omitted
- **No manual index on `_id`:** MongoDB automatically creates a unique index on `_id`. Adding an explicit index on `_id` alone would be a duplicate.
- **No `{ interests: 1 }` multikey index:** The Group by Interests aggregation performs an `$unwind` followed by a `$group` across all users. An index on `interests` is not utilized by `$unwind` without a preceding selective `$match` filter, making it redundant overhead.

Execution plans were verified in `tests/indexing.audit.test.ts` to confirm `IXSCAN` on all targeted queries.

---

## 4. MongoDB Aggregation Pipelines

### Scenario 1: Group Users by Interests
- **Endpoint:** `GET /api/aggregations/users-by-interests`
- **Constraint:** Executed via **exactly one** `User.aggregate()` call:
```typescript
User.aggregate([
  { $unwind: '$interests' },
  {
    $group: {
      _id: '$interests',
      count: { $sum: 1 },
      users: {
        $push: { _id: '$_id', name: '$name', email: '$email' },
      },
    },
  },
  { $sort: { count: -1, _id: 1 } },
]);
```

### Scenario 2: User Posts (`$lookup`)
- **Endpoint:** `GET /api/users/:userId/posts?page=1&limit=10`
- **Constraint:** Executed via a **single aggregation pipeline** beginning with `$match: { _id: userId }` on `User`, followed by `$lookup` with sorting and pagination applied inside the lookup sub-pipeline:
```typescript
User.aggregate([
  { $match: { _id: new Types.ObjectId(userId) } },
  {
    $lookup: {
      from: 'posts',
      let: { uId: '$_id' },
      pipeline: [
        { $match: { $expr: { $eq: ['$userId', '$$uId'] } } },
        { $sort: { createdAt: -1, _id: -1 } },
        { $skip: skip },
        { $limit: limit },
      ],
      as: 'posts',
    },
  },
  {
    $project: {
      _id: 1,
      name: 1,
      email: 1,
      role: 1,
      interests: 1,
      posts: 1,
      createdAt: 1,
    },
  },
]);
```

---

## 5. Seed Accounts & Credentials

Run `pnpm seed` to populate sample data:

| Account | Email | Password | Role | Interests |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | `admin@notely.com` | `admin123` | `admin` | `management`, `security`, `cloud` |
| **User Alice** | `alice@notely.com` | `user123` | `user` | `chess`, `reading` |
| **User Bob** | `bob@notely.com` | `user123` | `user` | `reading`, `coding` |
| **User Charlie** | `charlie@notely.com` | `user123` | `user` | `chess`, `gaming` |

---

## 6. Getting Started

### Prerequisites
- Node.js >= 18
- pnpm >= 8

### Installation & Environment
```bash
# 1. Install dependencies across workspace
pnpm install

# 2. Configure environment variables in server/.env
# MONGODB_URI and TEST_MONGODB_URI point to your MongoDB Atlas cluster.
```

### Seed Data
```bash
pnpm seed
```

### Run Automated Test Suite (100% Passing)
```bash
pnpm test
```

### Run Full Application (Server + Frontend)
```bash
pnpm dev
```
- API Server: `http://localhost:5000`
- Frontend Client: `http://localhost:3000`
