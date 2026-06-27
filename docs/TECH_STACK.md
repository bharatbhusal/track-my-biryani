# Tech Stack

## Primary Choices

- **Next.js 16 + App Router**: unified full-stack runtime.
- **TypeScript (strict)**: safe contracts and better DX.
- **Tailwind CSS v4**: utility-first styling with CSS custom properties for theming.
- **GSAP + @gsap/react**: high-performance page transitions and staggered entry animations.
- **React Query (@tanstack/react-query)**: caching, invalidation for server-state.
- **Zustand**: lightweight UI preference state (locale, currency, timezone).
- **Mongoose + MongoDB**: flexible data model for expenses and audit logs.
- **Zod**: runtime validation for env and API payloads.
- **Cloudinary**: secure media uploads and transformations.
- **react-hook-form + @hookform/resolvers**: form state management with Zod integration.
- **Recharts**: charting library for dashboard (bar, line charts).
- **Leaflet + react-leaflet**: map display for expense locations.
- **Sonner**: toast notifications.
- **date-fns**: date manipulation utilities.
- **Embla Carousel**: image carousel for expense detail view.
- **Radix UI**: accessible primitives (Dialog, Label, Popover, Slot).
- **TanStack Table**: expense list table with sorting.
- **PWA**: manifest and apple-mobile-web-app meta tags for installability.

## Alternatives Considered

- Redux Toolkit instead of Zustand (heavier for current UI-state scope).
- Prisma/PostgreSQL instead of Mongoose/MongoDB (more rigid schema, higher migration overhead for current model).
- S3 direct uploads instead of Cloudinary (would require separate transformation layer).
