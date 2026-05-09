# Architecture

## Frontend Architecture
- **Routing**: Next.js App Router pages in `src/app`.
- **Composition**: Feature-first components under `src/features/*`.
- **Design System**: Reusable UI components in `src/components/ui` with theme tokens.
- **State**:
  - React Query for remote state and retries.
  - Zustand (`ui-store`) for locale/currency/timezone/preferences.

## Backend Architecture
- **API**: Route handlers under `src/app/api/*`.
- **Validation**: Zod validators in `src/lib/validators.ts`.
- **Business Logic**: Services/controllers.
- **Persistence**: Repositories over Mongoose models.

## Auth Flow
1. User logs in/signup.
2. Server validates credentials and sets `httpOnly` JWT cookie.
3. Middleware checks protected routes and redirects unauthenticated users.
4. `/api/auth/me` hydrates client auth state.
5. Logout clears cookie and returns user to auth page.

## Upload Flow
1. Client requests signed Cloudinary params from `/api/uploads/signature`.
2. Client uploads selected/captured image directly to Cloudinary.
3. Only `public_id` is persisted in expense records.
4. URLs are generated with transformation utilities at render time.

## State Management & Caching
- Query-key factory in `src/lib/api/query-keys.ts`.
- Domain hooks in `src/hooks/api/*`.
- Mutations invalidate related keys (`expenses`, `dashboard`, `categories`).

## Folder Structure Rationale
- `lib/api`: boundary between UI and backend endpoints.
- `types`: centralized contracts per domain.
- `lib/cloudinary` + `lib/uploads`: shared media concerns.
- `features`: domain-oriented UI implementation.
