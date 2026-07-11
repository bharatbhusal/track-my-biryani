# Architecture

## Frontend Architecture

- **Routing**: Next.js App Router pages in `src/app`; protected routes via middleware.
- **Composition**: Feature-first components under `src/features/*`; reusable UI in `src/components/ui`.
- **Design System**: CSS custom properties for theming (light/dark), glassmorphism aesthetics, Tailwind CSS v4.
- **Animations**: GSAP for page transitions (`usePageTransition`), staggered `data-animate` entry animations.
- **State**:
  - React Query for remote state and cache invalidation.

## Backend Architecture

- **API**: Route handlers under `src/app/api/*`; thin wrappers that delegate to controllers.
- **Controllers**: Request/response handling, auth checks, delegate to services.
- **Services**: Business logic, validation, audit logging.
- **Repositories**: Database queries over Mongoose models.
- **Validation**: Zod validators in `src/lib/validators.ts`; centralized error schema.
- **Database**: MongoDB with indexed queries on userId, paidAt, categoryId, and text search.

### Request Flow

```
Route → Controller → Service → Repository → MongoDB
```

All API routes follow this pattern:
- Route: DB connect + controller call + response formatting
- Controller: Auth check + request parsing + service call
- Service: Business logic + validation + audit logging
- Repository: Database queries

## Auth Flow

```mermaid
sequenceDiagram
  actor U as User
  participant B as Browser
  participant N as Next.js Server
  participant M as MongoDB

  U->>B: Enter credentials
  B->>N: POST /api/auth/login
  N->>N: Validate credentials (bcrypt)
  N->>N: Create JWT
  N->>B: Set httpOnly cookie + user data
  B->>N: GET /api/auth/me
  N->>M: Query user
  M-->>N: User data
  N-->>B: AuthUser payload
  B->>B: Hydrate UI

  U->>B: Click Logout
  B->>N: POST /api/auth/logout
  N->>B: Clear cookie
  B->>B: Clear query cache, redirect to login
```

## Upload Flow

```mermaid
sequenceDiagram
  participant B as Browser
  participant N as Next.js Server
  participant C as Cloudinary

  B->>B: Compress image if > 5MB
  B->>B: Compute deterministic publicId
  B->>N: GET /api/uploads/signature?publicId=...
  N->>N: Sign upload params
  N-->>B: { timestamp, signature, apiKey, ... }
  B->>C: Upload image with signed params
  C-->>B: { public_id, ... }
  B->>B: Add publicId to images[]
  B->>N: POST /api/expenses { images, ... }
  N-->>B: created expense
  Note over B,N: Rendering uses buildCloudinaryUrl()<br/>to generate URLs on-the-fly
```

## Dashboard & Analytics

```mermaid
flowchart LR
  subgraph Client
    DR[DateRangeBar\nuser-selectable preset]
    RQ[Redux Thunk\nfetchDashboardData]
    S[Selectors\ntotalSpend, rankedCategories,\nstackedSeries, periodLabel]
    D[DashboardOverview]
    GC[GSAP animation\non mount]
  end

  subgraph Server
    API1["GET /api/expenses/all"]
    API2["GET /api/categories"]
  end

  subgraph DB["MongoDB"]
    EX[Expenses]
    CA[Categories]
  end

  DR -->|preset + offset| RQ
  RQ -->|Promise.all| API1
  RQ -->|Promise.all| API2
  API1 -->|fetch range| DB
  API2 -->|fetch all| DB
  DB -->|filtered data| RQ
  RQ -->|raw data| S
  S -->|computed| D
  GC -->|animate| D
```

### Dashboard Computation

Dashboard data is computed client-side using Redux selectors:
- `selectTotalSpend` — sum of all expense amounts
- `selectRankedCategories` — category totals sorted by value
- `selectStackedSeries` — period × category matrix
- `selectPeriodLabel` — human-readable date range
- `selectAverageSpend` — totalSpend / period count
- `selectCards` — summary card values

## DateTime & Timezone Safety

- `src/lib/datetime.ts` exports timezone-safe utilities:
  - `getLocalDateTimeInputValue(date)`: corrects offset and returns `YYYY-MM-DDTHH:mm` for datetime-local inputs.
  - `toUtcIsoString(input)`: converts local input → UTC ISO for storage.
  - `formatDateTime(value, locale, timeZone)`: formats using Intl.DateTimeFormat (respects locale and timezone preference).

## Export & Upload Naming

- `src/lib/naming.ts` ensures deterministic, production-safe filenames:
  - `buildTimestampedFilename({ baseName, extension, timestamp })`: e.g., `expense_report_1778021200.csv`.
  - `buildUploadPublicId(expenseName, timestamp)`: e.g., `coffee_expense_1778021200`.
- Applied to exports (`/api/export`) and Cloudinary uploads.

## State Management & Caching

- Query-key factory in `src/lib/api/query-keys.ts` (per-domain keys).
- Domain hooks in `src/hooks/api/*` (useDashboardQuery, useExpensesQuery, useCategoriesQuery, etc.).
- Mutations invalidate related cache keys on success (e.g., create expense invalidates expenses and dashboard).
- Optimistic update for create operations; mutation success invalidates related queries.

## PWA

- Root layout includes apple-mobile-web-app meta tags and safe-area CSS env variables.
- Manifest at `public/manifest.webmanifest` configures display, icons, and theme color.

## Folder Structure Rationale

- `lib/api`: tight boundary between UI and backend; centralized domain API clients.
- `lib/cloudinary`: Cloudinary signing, URL generation, and folder configuration.
- `lib/uploads`: client-side compression and validation.
- `lib/datetime`: timezone-safe utilities; used across forms and display.
- `lib/naming`: deterministic filenames for exports and uploads.
- `types`: centralized TypeScript contracts per domain (auth, expense, analytics, etc.).
- `features`: domain-oriented UI (expenses, categories, dashboard, settings).
- `components/ui`: design system; shared, reusable UI components.
- `components/charts`: chart components (bar, line) with time-range support.
- `components/providers`: React context providers (theme, query client, app-level providers).
- `hooks/api`: react-query hooks for each domain; centralize fetching logic and invalidation.
- `repositories`: Mongoose repository pattern; queries and mutations on collections.
- `services`: business logic (auth, audit, expense, category, user); stateless and reusable.
- `store/selectors`: memoized Redux selectors for computed/derived data.
- `controllers`: request/response handling (expense, category, user, audit controllers).
- `app/api`: route handlers; thin wrappers that delegate to controllers.
- `app/[domain]`: pages for each feature (expenses, categories, dashboard, settings).

## Theme-Aware UI

- `next-themes` manages theme state (light, dark, system).
- CSS custom properties (`var(--color-*)`) define the full color palette; light/dark variants in `.dark` class.
- Glassmorphism: backdrop-blur + semi-transparent backgrounds for header and bottom-nav.
- Skeleton loading uses `--color-surface-muted` for theme-aware shimmer.
- `ToastProvider` passes resolved theme to sonner; toasts adapt to current theme.
