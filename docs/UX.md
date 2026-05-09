# UX Guide

## User Journeys

1. **Authentication**: Signup/login redirects to dashboard.
2. **Quick Add**: Click quick-add button (fixed bottom-right on mobile, desktop) → modal opens → form auto-saves draft → submit records expense with glimpses.
3. **Dashboard**: View KPIs, category breakdown, and trends for selected time range (this week/month/year or custom).
4. **Expense Details**: Click expense → view full metadata (notes, payment method, tags), glimpse carousel, location map, and analytics (category percentile, contribution to week/month/year).
5. **Expense Management**: Search, filter, sort expenses → inline quick actions (view, edit, delete).
6. **Category Management**: Browse categories → view analytics (total spending, trends) → edit/delete.
7. **Settings**: Configure locale, timezone, currency, theme → export/import data → view audit logs.

## Quick Add Modal Flow

- **Draft Autosave**: Form values + selected images auto-save to localStorage (debounced 400ms) while modal is open.
- **Restore on Reopen**: If user closes quick-add and reopens, draft is restored.
- **Camera Support**: On mobile, camera input defaults to `capture="environment"` (rear camera); fallback to file picker on desktop or if device lacks camera API.
- **Glimpse Upload**: Client-side compression (> 5MB), deterministic naming, and Cloudinary signed upload with progress indicator.
- **Location**: Auto-detects geolocation on submit; user can override address field.

## Dashboard Analytics

- **Time Range Selector**: Buttons for "This Week", "This Month", "This Year", "Custom".
- **Custom Range**: Date picker shows from/to inputs; clicking "Apply" re-fetches dashboard data.
- **KPI Cards**: Display total spending, weekly spend, daily average, and top category; update reactively for selected range.
- **Charts**: Category breakdown (pie), daily trend (line), and weekly spend (bar); regenerate on range change.
- **Chart Export**: Icon button (download) on each chart → exports as PNG with timestamped filename (e.g., `category_breakdown_1778021200.png`).

## Responsive Behavior

- **Mobile**: Bottom navigation, full-screen quick-add modal, stacked cards, single-column tables.
- **Tablet**: Two-column grid for KPI cards, resizable charts.
- **Desktop**: Multi-column layout, charts side-by-side, expanded tables with inline actions.
- **Gestures**: Touch-friendly buttons, swipe scroll for tables.

## Theme & Toasts

- **Theme Toggle**: Header includes theme toggle (light/dark); theme preference persists in localStorage.
- **Toasts**: Success/error/info notifications appear top-right with theme-aware styling (adapts to current light/dark mode).
- **Animations**: Page transitions use GSAP for smooth enter/exit (fade-scale); charts animate on render.

## Accessibility

- **Keyboard Navigation**: All buttons and links accessible via Tab; modals close on Escape.
- **ARIA Labels**: Interactive elements include aria-label, aria-describedby where needed.
- **Focus Management**: Modal gets focus trap on open; focus returns to opener on close.
- **Screen Readers**: Form labels and error messages are semantic; status updates announced.
- **Color Contrast**: Theme colors meet WCAG AA standards.

## Loading & Error States

- **Skeleton Loading**: Dashboard and list pages show loading cards before data resolves.
- **Upload Progress**: Glimpse upload shows per-file progress bar; failed uploads show retry button.
- **Error Toasts**: Failed API calls toast with error message; user can retry.
- **Empty States**: Lists show "No expenses" or "No categories" with call-to-action button.
- **Not Found**: 404 page with link back to dashboard.

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
  A[Click Quick-Add Button] --> B[Modal Opens]
  B --> C[Form Auto-Saves Draft 400ms]
  C --> D[User Selects Glimpse]
  D --> E[Compress if >5MB]
  E --> F[Detect Location]
  F --> G[POST /api/expenses]
  G --> H[Invalidate Caches]
  H --> I[Close Modal + Toast]
  I --> J[Clear Draft]
```

### Dashboard Time-Range Flow

```mermaid
flowchart TD
  A[Dashboard Loads] --> B[Default: This Month]
  B --> C[GET /api/dashboard?preset=this_month]
  C --> D[Render KPIs + Charts]
  D --> E[User Selects Time Range]
  E --> F{Custom?}
  F -->|No| G[GET /api/dashboard?preset=X]
  F -->|Yes| H[Date Picker]
  H --> I[GET /api/dashboard?from=X&to=Y]
  G --> J[Refetch + Rerender]
  I --> J
```

### Expense Detail Flow

```mermaid
flowchart TD
  A[Click Expense] --> B[GET /api/expenses/:id]
  B --> C[Render Detail View]
  C --> D[Show Metadata]
  D --> E[Show Glimpse Carousel]
  E --> F[Show Analytics]
  F --> G[Show Map]
  G --> H[Action Buttons: Edit/Duplicate/Share/Delete]
```

### Glimpse Upload Flow

```mermaid
flowchart TD
  A[User Selects/Captures Image] --> B[Validate File]
  B --> C{Size >5MB?}
  C -->|Yes| D[Compress via Canvas]
  C -->|No| E[Use Original]
  D --> E
  E --> F[Compute Deterministic publicId]
  F --> G[GET /api/uploads/signature?publicId=X]
  G --> H[Upload to Cloudinary]
  H --> I[Receive public_id]
  I --> J[Add to Images Array]

```
