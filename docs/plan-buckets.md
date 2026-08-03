# Buckets Feature — Implementation Plan (single source of truth)

Full-stack, backward-compatible "buckets" (shared expense groups) for the
expense tracker. Built by 5 parallel agents (Game of Thrones theme), each in
its own git worktree. This file is committed to `develop` so every worktree
inherits it. **Read this fully before writing any code.**

---

## 1. Decisions (user-confirmed)

| Decision | Choice |
|---|---|
| Bucket switcher | Settings card **and** dashboard header dropdown |
| Invite | By exact username |
| Shared expense edit/delete | Only the poster (existing `userId` scoping preserved) |
| Shared category management | **Owner only** (create/edit/delete) |
| Delete bucket with expenses | Blocked (mirrors existing category rule) |
| Currency | Per-expense poster currency (no change) |
| Migration | Manual button in settings (`POST /api/settings/migrate`); idempotent, re-runnable |
| Owner exit | Owner cannot leave; must delete bucket |
| Auth model | No changes to JWT/cookies |

## 2. Core design (backward compatibility)

### Personal bucket = `bucketId: null`
Expenses and categories get an optional `bucketId` field. MongoDB
`{ bucketId: null }` matches both null and *missing*, so every legacy document
is implicitly part of the owner's personal bucket. **No forced migration is
required for correctness** — existing queries keep working untouched.

- Personal expense query: `{ userId, bucketId: null }`
- Personal category query: `{ userId, bucketId: null }`
- Shared bucket query: `{ bucketId }` (after membership validation)

### Shared buckets
A `Bucket` document owns:
- `name: string`
- `ownerId: ObjectId -> User`
- `members: [{ userId, role: 'owner'|'member', status: 'pending'|'accepted', invitedBy?, invitedAt?, joinedAt? }]`
- `timestamps`

The personal bucket is **never stored**; the buckets API synthesizes a virtual
Personal bucket (`_id: null`, name "Personal") for listing/UI only.

### Category scoping
- Personal: `{ userId: ownerId, bucketId: null, name, color, emoji }`
- Shared: `{ userId: bucket.ownerId, bucketId: <sharedId>, name, color, emoji }`

### Expense scoping
- Personal: `{ userId, bucketId: null, ...existing }`
- Shared: `{ bucketId, userId: poster, ...existing }` — poster is the existing
  `userId` field. Poster display name populated (from User) **only** for shared
  bucket responses; personal responses keep current shape (no name).

### Category index rework (critical, done by foundation)
The existing unique index `userId_1_name_1` on categories **collides** with
shared buckets (owner's personal "Food" vs shared "Food"). Replace it:
- Drop index `userId_1_name_1`.
- Add partial unique index: `{ bucketId: 1, name: 1 }` with
  `partialFilterExpression: { bucketId: { $type: "objectId" } }`.

Because the partial filter only covers `ObjectId` bucketIds, legacy
(`bucketId: null`) categories are exempt — per-user personal uniqueness is
enforced in app code via `findOne({ userId, bucketId: null, name })`.

### `ensureCategoryInBucket`
Shared helper (foundation): given `(userId, bucketId, { name, color, emoji })`,
return the category `_id`, finding the existing category in that bucket by name
or creating a new one (same name, color, emoji). Used by:
- Expense **move between buckets** (reuse existing name or clone color/emoji/name)
- Shared-bucket expense posting (validates category belongs to bucket)
- Migration

Personal bucket variant: find-or-create `{ userId, bucketId: null, name }`.

### Migration service (`POST /api/settings/migrate`)
Idempotent; owner runs from settings. Steps:
1. Drop `userId_1_name_1` index on categories (ignore if absent).
2. Build partial unique index `{bucketId:1,name:1}` (partialFilterExpression as above).
3. Backfill `bucketId: null` on all legacy categories and expenses for the user
   (only docs missing `bucketId`).
4. Return `{ migratedCategories, migratedExpenses }`.

## 3. Active bucket state & UI switching

- `uiSlice.activeBucketId: string | null` (`null` = personal). Persisted via
  existing redux-persist `ui` whitelist.
- New `bucketSlice`: `buckets` (list incl. virtual personal + accepted shared),
  `invitations` (pending buckets), `loading`, `error`, and thunks
  `fetchBuckets`, `createBucket`, `updateBucket`, `deleteBucket`, `inviteUser`,
  `acceptInvite`, `declineInvite`, `leaveBucket`, `revokeInvite`, `fetchInvitations`.
- All expense/category/dashboard/analytics client calls add `bucketId` query
  param when a shared bucket is active (omitted/absent = personal).

## 4. API surface

### New endpoints
| Method/Path | Auth | Notes |
|---|---|---|
| `GET /api/buckets` | user | Returns `{ items: [virtual personal + accepted shared], invitations: [pending buckets] }` |
| `POST /api/buckets` | user | Body `{ name }`. Creates bucket + default categories. Owner becomes accepted member. |
| `GET /api/buckets/:id` | accepted member | Bucket detail incl. members with names |
| `PATCH /api/buckets/:id` | owner | Rename; body `{ name }` |
| `DELETE /api/buckets/:id` | owner | Blocked (400 `HAS_EXPENSES`) if any expenses exist in bucket |
| `POST /api/buckets/:id/invite` | owner | Body `{ username }`. Error if user unknown or already member (incl. pending). Adds pending member. |
| `POST /api/buckets/:id/accept` | invitee (pending) | Sets status accepted |
| `POST /api/buckets/:id/decline` | invitee (pending) | Removes member entry |
| `POST /api/buckets/:id/leave` | accepted member (non-owner) | Removes member entry; owner → 400 `OWNER_CANNOT_LEAVE` |
| `DELETE /api/buckets/:id/members/:userId` | owner | Revoke pending invite or remove member |
| `POST /api/settings/migrate` | user | Runs migration service, returns counts |

### Modified endpoints (all get optional `bucketId` query param)
- `GET /api/expenses`, `POST /api/expenses`, `GET/PUT/DELETE /api/expenses/:id`,
  `GET /api/expenses/:id/contribution`, `GET /api/expenses/overview`,
  `GET /api/expenses/chart`
- `GET /api/categories`, `POST /api/categories`, `GET/PUT/DELETE /api/categories/:id`,
  `GET /api/categories/:id/stats`, `GET /api/categories/distribution`,
  `GET /api/categories/stats`
- `GET /api/export` (scope to active bucket)

### Scoping semantics
- `bucketId` absent/`null`/`"personal"` → personal (`{ userId, bucketId: null }`).
- `bucketId` present → look up bucket, verify requester is an **accepted**
  member, else 403 `NOT_A_MEMBER`.
- On expense create/update with a shared `bucketId`: `categoryId` must belong to
  that bucket (400 `CATEGORY_NOT_IN_BUCKET`); members cannot create categories
  (owner-only). On personal: `categoryId` must be a personal category of the user.
- **Move expense**: update with a different `bucketId` → resolve destination
  category via `ensureCategoryInBucket` from the source category's
  name/color/emoji; update `categoryId` + `bucketId`. Personal ⇄ shared both ways.
- Poster-only edit/delete in shared buckets (existing `{ _id, userId }` scoping).

## 5. Worktrees & branches (off `develop`)

`~/.local/share/opencode/worktree/` (existing convention).

1. `feat/buckets/foundation` — Eddard Stark (setup, merges FIRST)
2. `feat/buckets/backend-buckets` — Daenerys Targaryen
3. `feat/buckets/backend-scope` — Jon Snow
4. `feat/buckets/frontend-settings` — Tyrion Lannister
5. `feat/buckets/frontend-ux` — Arya Stark

## 6. Agent briefs (exclusive file ownership — do not edit files outside your list)

### 0. Eddard Stark — The Foundation
Files (create/edit ONLY these):
- `src/models/Bucket.ts` (new)
- `src/models/Category.ts` (add `bucketId`, replace unique index)
- `src/models/Expense.ts` (add optional `bucketId`, keep index)
- `src/lib/constants.ts` (move `DEFAULT_CATEGORIES` here from `auth.service.ts`)
- `src/lib/bucket.ts` (new): membership resolver
  `resolveBucketContext(userId, bucketId?) -> Promise<{ bucketId: string | null }>`;
  personal=null convention; throws `AppError` 403 `NOT_A_MEMBER`.
- `src/repositories/category.repository.ts`: add `ensureCategoryInBucket(userId, bucketId, { name, color, emoji })`.
- `src/services/migration.service.ts` (new): index rework + backfill (section 2).
- `src/types/bucket.types.ts` (new) + export from `src/types/index.ts`.
- `src/lib/api/buckets.ts` (new): client API (uses `apiRequest`).
- `src/store/slices/bucketSlice.ts` (new): state + thunks (section 3).
- `src/store/index.ts`: register `bucketSlice`.
- `src/store/slices/uiSlice.ts`: add `activeBucketId: string | null` (default null) + `setActiveBucketId`.
- `src/services/auth.service.ts`: import `DEFAULT_CATEGORIES` from constants (behavior unchanged).

Also **update `src/lib/validators.ts` `expenseSchema` with optional `bucketId`**.
(Jon would otherwise touch this file — Eddard owns it to keep file ownership clean.)

Run migration once against the dev DB after merging (index rework + backfill).
Verify: `npx tsc --noEmit`, `npm run lint`.

### 1. Daenerys Targaryen — Mother of Buckets (backend buckets/membership)
Files:
- `src/repositories/bucket.repository.ts` (new)
- `src/services/bucket.service.ts` (new)
- `src/controllers/bucket.controller.ts` (new)
- `src/app/api/buckets/**` (routes)
- `src/app/api/settings/migrate/route.ts` (new, calls migration service)
- `src/services/audit.service.ts` (add `logAuditEvent` calls for bucket mutations)

Rules from sections 2 & 4. Default categories seeded on bucket create
(`DEFAULT_CATEGORIES` from `@/lib/constants`).
Verify: `npx tsc --noEmit`, `npm run lint`.

### 2. Jon Snow — The Watcher (backend scoping)
Files:
- `src/repositories/expense.repository.ts`
- `src/repositories/category.repository.ts`
- `src/services/expense.service.ts`
- `src/services/category.service.ts`
- `src/controllers/expense.controller.ts`
- `src/controllers/category.controller.ts`
- `src/app/api/expenses/**`, `src/app/api/categories/**`
- `src/app/api/export/route.ts`

Thread `bucketId` everywhere per section 4 scoping rules; move-expense via
`ensureCategoryInBucket`; poster name populated only for shared buckets.
Verify: `npx tsc --noEmit`, `npm run lint`.

### 3. Tyrion Lannister — The Hand (frontend: settings + switcher)
Files:
- `src/features/settings/components/**` (settings page: bucket list incl.
  virtual Personal, create/rename/delete, invite by username, pending-invite
  accept/decline, leave, revoke, migration card)
- `src/components/layout/bucket-switcher.tsx` (new, reusable dropdown)

Consumes `bucketSlice` + `bucketsApi` (Eddard's). Do NOT touch
`src/app/(main)/settings/page.tsx` if unnecessary (SettingsPage is the entry).
Verify: `npx tsc --noEmit`, `npm run lint`.

### 4. Arya Stark — The Faceless Integrator (frontend: UX)
Files:
- `src/features/expenses/components/expense-form.tsx` (bucket selector, defaults personal)
- `src/features/expenses/components/expense-detail-view.tsx` (move-to-bucket action, poster name in shared)
- `src/features/expenses/components/expense-table.tsx`
- `src/features/categories/components/category-manager.tsx` (owner-only category actions in shared)
- `src/features/dashboard/components/dashboard-overview.tsx` (render BucketSwitcher, refetch on switch)
- `src/store/slices/expenseSlice.ts`, `src/store/slices/categorySlice.ts`
- `src/lib/api/expenses.ts`, `src/lib/api/analytics.ts` (bucketId param)

Verify: `npx tsc --noEmit`, `npm run lint`.

## 7. Merge protocol & conflict ownership

1. Sequential merge order: foundation → backend-buckets → backend-scope →
   frontend-settings → frontend-ux.
2. Agents commit + push their branch. Orchestrator merges to `develop` with
   `--no-ff`; then fast-forward `develop` into each subsequent branch before its
   merge (`git merge develop`) so later merges are clean.
3. **Conflicts are resolved by the AUTHORING agent**, never the orchestrator or a
   third party: orchestrator resumes the owning agent in its own worktree
   (branch still pointed at its feature branch), gives it the exact conflict
   list; the agent resolves, re-verifies (`tsc`, `lint`), and pushes. Then the
   merge is retried.
4. Final: full `npm run build` on `develop`.

## 8. Verification & conventions

- No test framework exists in the repo. Verification = `npx tsc --noEmit`,
  `npm run lint`, `npm run build`.
- For non-trivial money/move logic, leave ONE small runnable self-check
  (`assert`-based) where the logic lives, marked with a `ponytail:` comment if
  it is a deliberate simplification.
- Follow existing style: tabs for indentation, `@/` path aliases,
  controller→service→repository→model layering, Zod validators,
  `successResponse`/`errorResponse`, `logAuditEvent` on mutations.
- Do NOT use Playwright/browser automation.
- Do NOT commit `.env` or secrets. `.env` already exists locally — agents rely
  on existing env for the dev DB.
