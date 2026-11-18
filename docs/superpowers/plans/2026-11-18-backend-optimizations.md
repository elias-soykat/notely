# Backend Optimizations & Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement clean, minimalist fixes for the High and Medium priority issues identified during the backend requirements audit.

**Architecture:** 
1. Index `Post` with `{ createdAt: -1, _id: -1 }` to eliminate `COLLSCAN` on `GET /api/posts`.
2. Enhance `getUserPosts` aggregation pipeline to compute and project pagination metadata (`totalCount`, `totalPages`, `page`, `limit`) within the single `User.aggregate()` pipeline.
3. Move `authRateLimiter` so it protects `POST /register` and `POST /login` without throttling `GET /me`.
4. Validate `req.query.userId` in `GET /api/notes` to return `400 Bad Request` on invalid ObjectId formats.

**Tech Stack:** TypeScript, Express, Mongoose, MongoDB Atlas, Vitest, Supertest, Vite + React.

**Spec:** `c:\Users\Elias\elias\notely\Backend Task Requirements.md`

## Global Constraints
- TypeScript across server and client.
- Strictly adhere to `schema.index(...)` declarations.
- DO NOT create unnecessary indexes. Every index must be justified by an existing query.
- Use a single `User.aggregate()` pipeline for Scenario 2.
- Minimalist changes across minimal files.

---

### Task 1: Add `{ createdAt: -1, _id: -1 }` to Post Schema & Update Index Audit Test

**Files:**
- Modify: `server/src/models/Post.ts`
- Modify: `server/tests/indexing.audit.test.ts`
- Modify: `README.md`

- [ ] **Step 1: Update Post model index**
Add `PostSchema.index({ createdAt: -1, _id: -1 });` in `server/src/models/Post.ts`.

- [ ] **Step 2: Update indexing audit tests**
Update `server/tests/indexing.audit.test.ts` to verify `Post` has `createdAt_-1__id_-1` and verify query `Post.find().sort({ createdAt: -1, _id: -1 })` uses `IXSCAN`.

- [ ] **Step 3: Run indexing audit test to verify pass**
Run: `pnpm --filter server test tests/indexing.audit.test.ts`
Expected: PASS

---

### Task 2: Return Pagination Metadata in Scenario 2 (`getUserPosts`)

**Files:**
- Modify: `server/src/controllers/aggregation.controller.ts`
- Modify: `server/tests/aggregations/posts.aggregation.test.ts`
- Modify: `client/src/components/AggregationsView.tsx`

- [ ] **Step 1: Enhance `getUserPosts` pipeline**
Use `$facet` within `$lookup` pipeline to compute both paginated `posts` and `totalCount`, then project `page`, `limit`, `totalCount`, `totalPages`, preserving top-level user fields.

- [ ] **Step 2: Update aggregation tests**
Assert that `res.body.totalCount`, `res.body.totalPages`, `res.body.page`, and `res.body.limit` are returned alongside `_id`, `name`, and `posts`.

- [ ] **Step 3: Update `AggregationsView.tsx` UI**
Show total posts and disable "Next" button when `postPage >= totalPages`.

- [ ] **Step 4: Run posts aggregation test**
Run: `pnpm --filter server test tests/aggregations/posts.aggregation.test.ts`
Expected: PASS

---

### Task 3: Isolate Auth Rate Limiter to Sensitive Endpoints & Validate Note Filter Query

**Files:**
- Modify: `server/src/app.ts`
- Modify: `server/src/routes/auth.routes.ts`
- Modify: `server/src/controllers/note.controller.ts`
- Modify: `server/tests/routes/note.routes.test.ts`

- [ ] **Step 1: Restrict rate limiter in `auth.routes.ts` & `app.ts`**
Export `authRateLimiter` from `app.ts` (or middleware) and attach it only to `POST /register` and `POST /login`.

- [ ] **Step 2: Add validation for `req.query.userId` in `note.controller.ts`**
If `req.query.userId` is present and invalid, return `400 Bad Request`.

- [ ] **Step 3: Add test in `note.routes.test.ts`**
Verify `GET /api/notes?userId=invalid` returns `400 Bad Request`.

- [ ] **Step 4: Run test suites**
Run: `pnpm --filter server test tests/routes/note.routes.test.ts tests/routes/auth.routes.test.ts`
Expected: PASS

---

### Task 4: Full Suite Verification & Build Sanity

- [ ] **Step 1: Run full server test suite with MongoDB Atlas**
Run: `pnpm --filter server test`
Expected: 100% PASS across all 11 test suites.

- [ ] **Step 2: Run client build**
Run: `pnpm --filter client build`
Expected: PASS
