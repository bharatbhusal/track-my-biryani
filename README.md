# Daily Expenses Tracker

Production-grade full-stack expense tracker built with Next.js App Router, TypeScript, MongoDB, React Query, Zustand, and Cloudinary.

## Features
- JWT cookie auth with protected routes and redirect-safe middleware
- Expense/category management with analytics dashboard
- Dark/light/system theme with persisted preference (`next-themes`)
- Locale-aware currency/timezone preference detection
- Receipt upload via drag/drop + camera capture + Cloudinary signed uploads
- Data export (JSON/CSV) including expenses, activity logs, and analytics metadata

## Setup
1. Install dependencies
```bash
npm install
```

2. Configure env
```bash
cp .env.example .env.local
```

3. Start dev server
```bash
npm run dev
```

## Environment Variables
- `DATABASE_URL`: MongoDB connection URI (primary)
- `MONGODB_URI`: Optional legacy alias
- `JWT_SECRET`: JWT signing secret
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `CLOUDINARY_FOLDER_NAME`: Cloudinary folder for receipts
- `NEXT_PUBLIC_API_URL`: Client API base URL (default `/api`)

## Scripts
- `npm run dev` - development server
- `npm run lint` - lint checks
- `npm run build` - production build
- `npm run start` - run production server

## Architecture Overview
- `src/app`: routes + API handlers
- `src/features`: feature UI modules
- `src/components`: reusable UI/layout/providers/uploads
- `src/lib`: shared utilities, env config, API layer, cloudinary/uploads
- `src/hooks`: app hooks and React Query hooks
- `src/models`, `src/repositories`, `src/services`, `src/controllers`: backend layering
- `src/types`: centralized domain types

## API Overview
Main APIs:
- Auth: `/api/auth/*`
- Expenses: `/api/expenses`
- Categories: `/api/categories`
- Analytics: `/api/dashboard`
- Logs: `/api/logs`
- Upload Signature: `/api/uploads/signature`
- Export/Import: `/api/export`, `/api/import`

Detailed docs: [`docs/API.md`](docs/API.md)

## Screenshots
- Dashboard: `docs/screenshots/dashboard.png` (placeholder)
- Expenses: `docs/screenshots/expenses.png` (placeholder)
- Settings: `docs/screenshots/settings.png` (placeholder)

## Deployment Guide
1. Set all environment variables in hosting platform.
2. Ensure MongoDB network access allows deployment environment.
3. Build and start:
```bash
npm run build
npm run start
```
4. Configure Cloudinary credentials and folder.

## Troubleshooting
- **Invalid environment configuration**: verify `.env.local` against `.env.example`.
- **Auth redirect loops**: clear auth cookie and login again.
- **Upload failures**: verify Cloudinary credentials/folder and file constraints.
- **Build issues**: run `npm run lint` then `npm run build` locally.

## Additional Documentation
- [`docs/HLD.md`](docs/HLD.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/API.md`](docs/API.md)
- [`docs/UX.md`](docs/UX.md)
- [`docs/TECH_STACK.md`](docs/TECH_STACK.md)
- [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md)
