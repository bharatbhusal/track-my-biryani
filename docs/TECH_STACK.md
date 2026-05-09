# Tech Stack

## Primary Choices
- **Next.js 16 + App Router**: unified full-stack runtime.
- **TypeScript (strict)**: safe contracts and better DX.
- **Tailwind CSS v4**: fast, token-friendly styling.
- **React Query**: caching, retries, invalidation for server-state.
- **Zustand**: lightweight UI preference state.
- **Mongoose + MongoDB**: flexible data model for expenses/logs.
- **Zod**: runtime validation for env and API payloads.
- **Cloudinary**: secure media uploads and transformations.

## Alternatives Considered
- Redux Toolkit instead of Zustand (heavier for current UI-state scope).
- Prisma/PostgreSQL instead of Mongoose/MongoDB (more rigid schema, higher migration overhead for current model).
- S3 direct uploads instead of Cloudinary (would require separate transformation layer).
