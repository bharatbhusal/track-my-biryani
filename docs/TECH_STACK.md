# Tech Stack

## Primary Choices

- **Next.js 16 + App Router**: unified full-stack runtime.
- **TypeScript (strict)**: safe contracts and better DX.
- **Tailwind CSS v4**: utility-first styling with CSS custom properties for theming.
- **GSAP**: high-performance page transitions and staggered entry animations.
- **React Query**: caching, retries, invalidation for server-state.
- **Zustand**: lightweight UI preference state.
- **Mongoose + MongoDB**: flexible data model for expenses and audit logs.
- **Zod**: runtime validation for env and API payloads.
- **Cloudinary**: secure media uploads and transformations.
- **PWA**: service worker for installability; apple-mobile-web-app meta tags.

## Alternatives Considered

- Redux Toolkit instead of Zustand (heavier for current UI-state scope).
- Prisma/PostgreSQL instead of Mongoose/MongoDB (more rigid schema, higher migration overhead for current model).
- S3 direct uploads instead of Cloudinary (would require separate transformation layer).
