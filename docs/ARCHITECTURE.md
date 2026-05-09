# Architecture

## Frontend Architecture

- **Routing**: Next.js App Router pages in `src/app`; protected routes via middleware.
- **Composition**: Feature-first components under `src/features/*`; reusable UI in `src/components/ui`.
- **Design System**: Theme tokens, Tailwind CSS; Manrope font for typography.
- **State**:
  - React Query for remote state, polling, and cache invalidation.
  - Zustand (`ui-store`) for locale/currency/timezone/preferences with localStorage persistence.

## Backend Architecture

- **API**: Route handlers under `src/app/api/*`; dynamic server routes with auth middleware.
- **Validation**: Zod validators in `src/lib/validators.ts`; centralized error schema.
- **Business Logic**: Controllers in `src/controllers`, services in `src/services`.
- **Persistence**: Repositories over Mongoose models; soft-delete pattern for expenses (deletedAt field).
- **Database**: MongoDB with indexed queries on userId, dateTime, categoryId, and text search.

## Auth Flow

1. User logs in/signup via `POST /api/auth/login` or `POST /api/auth/signup`.
2. Server validates credentials, hashes password (bcrypt), creates JWT, and sets `httpOnly` JWT cookie.
3. Middleware (`src/middleware/auth.ts`) checks protected routes; redirects unauthenticated users to login.
4. Client hydrates auth state via `GET /api/auth/me`; hooks (`useAuthMe()`) trigger refetch on mount.
5. Logout (`POST /api/auth/logout`) clears cookie and removes query cache; returns user to auth page.

## Upload Flow

1. Client (in QuickAddExpenseModal or ReceiptUpload) computes deterministic `publicId` via `buildUploadPublicId(expenseName)`.
2. Client requests signed payload: `GET /api/uploads/signature?publicId=<deterministic-id>`.
3. Server signs the upload request with Cloudinary API, including the `public_id`.
4. Client compresses image if > 5MB (canvas-based, client-side).
5. Client uploads directly to Cloudinary with signed params; receives `publicId` from response.
6. Client stores only `publicId` strings in expense `images[]` array; persists via `POST /api/expenses`.
7. Rendering generates transformation URLs on-the-fly using `buildCloudinaryUrl()`.

## Analytics & Time-Range Flow

1. Dashboard (`src/features/dashboard/components/dashboard-overview.tsx`) renders `TimeRangeSelector`.
2. User selects preset (this_week, this_month, this_year) or custom date range.
3. Component calls `setRangeParams()` which triggers React Query refetch with new params.
4. Client calls `useDashboardQuery(rangeParams)` which sends query params to server.
5. Server (`src/app/api/dashboard/route.ts`) computes date range (preset or custom), filters expenses, and aggregates:
   - KPIs: totalRangeSpend, weeklySpend, dailyAverage, topCategory
   - Category breakdown
   - Daily trend (for charts)
   - Recent activity
6. Response hydrates dashboard cards and charts with range-scoped data.

## DateTime & Timezone Safety

- `src/lib/datetime.ts` exports timezone-safe utilities:
  - `getLocalDateTimeInputValue(date)`: corrects offset and returns `YYYY-MM-DDTHH:mm` for datetime-local inputs.
  - `toUtcIsoString(input)`: converts local input → UTC ISO for storage.
  - `formatDateTime(value, locale, timeZone)`: formats using Intl.DateTimeFormat (respects locale and timezone preference).
  - `getPresetDateRange(preset)`: computes date ranges (e.g., "this week" relative to now).

## Export & Upload Naming

- `src/lib/naming.ts` ensures deterministic, production-safe filenames:
  - `buildTimestampedFilename({ baseName, extension, timestamp })`: e.g., `expense_report_1778021200.csv`.
  - `buildUploadPublicId(expenseName, timestamp)`: e.g., `coffee_expense_1778021200`.
- Applied to exports (`/api/export`), chart PNG downloads (`ExportableChart`), and receipt uploads.

## State Management & Caching

- Query-key factory in `src/lib/api/query-keys.ts` (per-domain keys).
- Domain hooks in `src/hooks/api/*` (useDashboardQuery, useExpensesQuery, useCategoriesQuery, etc.).
- Mutations invalidate related cache keys on success (e.g., create expense invalidates expenses and dashboard).
- Optimistic updates for delete, create, and update operations.
- UI state persisted in Zustand with localStorage (preferences, theme, locale).

## Folder Structure Rationale

- `lib/api`: tight boundary between UI and backend; centralized domain API clients.
- `lib/cloudinary`: Cloudinary signing, URL generation, and folder configuration.
- `lib/uploads`: client-side compression and validation.
- `lib/datetime`: timezone-safe utilities; used across forms and display.
- `lib/naming`: deterministic filenames for exports and uploads.
- `types`: centralized TypeScript contracts per domain (auth, expense, analytics, etc.).
- `features`: domain-oriented UI (expenses, categories, dashboard, settings, logs).
- `components/ui`: design system; shared, reusable UI components.
- `components/charts`: chart components (pie, line, bar, area) with time-range support.
- `components/providers`: React context providers (theme, query client, app-level providers).
- `hooks/api`: react-query hooks for each domain; centralize fetching logic and invalidation.
- `repositories`: Mongoose repository pattern; queries and mutations on collections.
- `services`: business logic (auth, mail, etc.); stateless and reusable.
- `middleware`: request-level middleware (auth, logging, etc.).
- `app/api`: route handlers; endpoints grouped by domain.
- `app/[domain]`: pages for each feature (expenses, categories, dashboard, settings, logs).

## Theme-Aware UI

- `next-themes` manages theme state (light, dark, system).
- Tailwind CSS applies theme-aware colors via CSS variables (var(--color-\*)).
- `ToastProvider` (src/components/ui/toast-provider.tsx) passes resolved theme to react-toastify; toasts adapt to current theme.
