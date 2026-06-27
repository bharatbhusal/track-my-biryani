# UX Guide

## User Journeys

1. **Authentication**: Signup/login redirects to dashboard.
2. **Quick Add**: Click quick-add button → navigates to `/expenses/new` page → form auto-saves draft to localStorage (400ms debounce) → submit records expense.
3. **Dashboard**: View KPIs, category breakdown, and trends.
4. **Expense Details**: Click expense → view full metadata (notes), image carousel, location map.
5. **Expense Management**: Search, filter, sort expenses → inline quick actions (view, edit, delete).
6. **Category Management**: Browse categories → create/edit/delete.

## Quick Add Flow

- **Page Navigation**: Quick-add FAB navigates to `/expenses/new` page.
- **Draft Autosave**: Form values auto-save to localStorage (debounced) while form has content.
- **Restore on Return**: If user navigates away and returns, draft is restored.
- **Image Upload**: Client-side compression (> 5MB), deterministic naming, and Cloudinary signed upload with progress indicator.
- **Location**: Auto-detects geolocation on mount; user can override.

## Dashboard Analytics

- **Range**: Dashboard uses a persisted user-selectable range (Day, Week, Month, Year) via `DateRangeBar`; preference stored in localStorage.
- **KPI Cards**: Display total spend and spend-per-day/month via a flex-wrap grid of stat cards.
- **Charts**: Category breakdown (horizontal bar) and stacked daily trend (bar chart).

## Header Controls

- **Theme Toggle**: Light/dark switch in the header.
- **Login/Logout**: Authenticated users see their name + logout button; guests see a Login button.

## Navigation

- **Bottom Nav**: Four-tab pill-style navigation (Dashboard, Expenses, Categories, Settings) with chiclet active indicator.
- **Safe Area**: PWA safe-area padding for notched devices.
- **Quick Add FAB**: Floating action button in bottom-right corner navigates to `/expenses/new`; hidden on auth pages and `/expenses/new`.

## Responsive Behavior

- **Mobile**: Bottom navigation, full-screen quick-add modal, stacked cards, single-column layout.
- **Tablet**: Two-column grid for KPI cards.
- **Desktop**: Multi-column layout, charts side-by-side.

## Theme & Visual Design

- **Design System**: CSS custom properties for colors, shadows, and radii. Glassmorphism header/nav with backdrop blur.
- **Theme Toggle**: Header includes theme toggle (light/dark); theme preference persists in localStorage.
- **GSAP Animations**: Page shell fades + scales in on mount. Elements with `[data-animate]` stagger in with configurable delays.
- **Reduced Motion**: Respects `prefers-reduced-motion: reduce` — animations are skipped.

## Accessibility

- **Keyboard Navigation**: All buttons and links accessible via Tab; modals close on Escape.
- **ARIA Labels**: Interactive elements include aria-label, aria-describedby where needed.
- **Focus Management**: Modal gets focus trap on open; focus returns to opener on close.
- **Screen Readers**: Form labels and error messages are semantic; status updates announced.
- **Color Contrast**: Theme colors meet WCAG AA standards.

## Loading & Error States

- **Skeleton Loading**: Dashboard and list pages show loading cards before data resolves.
- **Upload Progress**: Image upload shows per-file progress bar; failed uploads show retry button.
- **Error Toasts**: Failed API calls toast with error message; user can retry.
- **Empty States**: Lists show "No expenses" or "No categories" with call-to-action button.
- **Not Found**: 404 redirects to dashboard.

## Mermaid Flows

### Auth Flow

```mermaid
flowchart TD
  A[Auth Page] --> B[POST /api/auth/login]
  B --> C[Set JWT Cookie]
  C --> D[Redirect Dashboard]
  D --> E[GET /api/auth/me]
  E --> F[Hydrate UI]
```

### Quick Add Expense Flow

```mermaid
flowchart TD
  A[Click Quick-Add FAB] --> B[Navigate to /expenses/new]
  B --> C[Form Auto-Saves Draft]
  C --> D[User Selects Image]
  D --> E[Compress if >5MB]
  E --> F[Detect Location]
  F --> G[POST /api/expenses]
  G --> H[Invalidate Caches]
  H --> I[Redirect to /expenses/:id + Toast]
  I --> J[Clear Draft]
```

### Expense Detail Flow

```mermaid
flowchart TD
  A[Click Expense] --> B[GET /api/expenses/:id]
  B --> C[Render Detail View]
  C --> D[DateRangeBar for\ncontribution scope]
  C --> E[Metadata: amount,\ndate, notes]
  E --> F[Category analytics:\navg spend, count, total]
  F --> G[Image gallery:\nnative snap-x scroll]
  G --> H[Map preview:\nLeaflet/Google Map]
  H --> I[Actions:\nEdit / Delete]
```

### Image Upload Flow

```mermaid
flowchart TD
    A["User Selects Image"] --> B["Validate File"]
    B --> C{"Size > 5MB?"}
    C -->|Yes| D["Compress via Canvas"]
    C -->|No| E["Use Original"]
    D --> E
    E --> F["Compute Deterministic publicId"]
    F --> G["GET /api/uploads/signature?publicId=X"]
    G --> H["Upload to Cloudinary with signed params"]
    H --> I["Receive public_id"]
    I --> J["Add publicId to images array"]
    J --> K["POST /api/expenses with images array"]
    K --> L["Backend stores publicId strings"]
    L --> M["Rendering: buildCloudinaryUrl()<br/>generates image URL on-the-fly"]
```
