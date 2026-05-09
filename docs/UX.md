# UX Guide

## User Journeys
- Signup/login and land on dashboard.
- Add expenses quickly with category + receipt upload.
- Review analytics charts and recent activity.
- Manage categories.
- Configure locale/currency/timezone/theme.
- Export/import data.

## Empty/Loading/Error States
- Dashboard and lists render loading cards before data resolves.
- Uploads show progress and retry UI.
- Forms show toast feedback on failures and success.

## Responsive Behavior
- Mobile-first spacing and bottom navigation on small screens.
- Cards and grids collapse to single-column where needed.

## Mermaid Flows
### Auth Flow
```mermaid
flowchart TD
A[Auth Page] --> B[POST /api/auth/login]
B --> C[Set JWT Cookie]
C --> D[Redirect Dashboard]
D --> E[GET /api/auth/me]
```

### Expense Creation Flow
```mermaid
flowchart TD
A[Expense Form] --> B[Validate Input]
B --> C[Detect Location]
C --> D[POST /api/expenses]
D --> E[Invalidate Query Cache]
E --> F[Refresh Dashboard + Expenses]
```

### Upload Flow
```mermaid
flowchart TD
A[Drop/Camera Select] --> B[GET /api/uploads/signature]
B --> C[Upload to Cloudinary]
C --> D[Receive public_id]
D --> E[Persist public_id in Expense]
```

### Dashboard Flow
```mermaid
flowchart TD
A[Dashboard Page] --> B[GET /api/dashboard]
B --> C[Render KPIs]
C --> D[Render Charts]
D --> E[Export Data]
```
