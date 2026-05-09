# API Documentation

All APIs return `{ success, data }` or `{ success, error }`.

## Auth APIs

### `POST /api/auth/signup`

- Auth: No
- Body: `{ name, email, password }`
- Response: `{ id, name, email }`

### `POST /api/auth/login`

- Auth: No
- Body: `{ email, password }`
- Response: `{ id, name, email }` + auth cookie

### `POST /api/auth/logout`

- Auth: Yes
- Body: none
- Response: `{ message }`

### `GET /api/auth/me`

- Auth: Yes
- Response: `{ id, name, email, preferences }`

## Expense APIs

### `GET /api/expenses`

- Auth: Yes
- Query: `page`, `limit`, `q`, `categoryId`, `sortBy`, `order`, `paymentMethod`, `tags`, `from`, `to`, `amountMin`, `amountMax`
- Response: paginated expense list (filters exclude soft-deleted items)
- Sorting: `dateTime`, `amount`, `title` with `asc`/`desc` order

### `GET /api/expenses/:id`

- Auth: Yes
- Response: full expense detail including metadata (notes, paymentMethod, tags, location, images)

### `POST /api/expenses`

- Auth: Yes
- Body: `{ title, amount, categoryId, images[], location, currency, dateTime, notes?, paymentMethod?, tags[] }`
- Validation: Zod `expenseSchema`
- Response: created expense with generated `_id`

### `PUT /api/expenses/:id`

- Auth: Yes
- Body: same as POST
- Response: updated expense

### `DELETE /api/expenses/:id`

- Auth: Yes
- Notes: Soft-delete (sets `deletedAt` field); expense remains retrievable for undo flows
- Response: deletion confirmation

### `GET /api/categories/:id`

- Auth: Yes
- Response: category detail with analytics (total spending, trends, top expenses)

## Category APIs

- `GET /api/categories` — list all categories
- `POST /api/categories` — create new category
- `PUT /api/categories/:id` — update category
- `DELETE /api/categories/:id` — delete category

## Analytics & Logs APIs

### `GET /api/dashboard`

- Auth: Yes
- Query Parameters:
  - `preset`: `this_week` | `this_month` | `this_year` (default: `this_month`)
  - `from`: ISO date string for custom range
  - `to`: ISO date string for custom range
- Response: totals, trends, breakdowns, recent activity scoped to selected time range
- Notes: Server aggregates expenses within the selected range and computes analytics (KPIs, category breakdown, daily trend, etc.)

### `GET /api/logs`

- Auth: Yes
- Query: `page`, `limit`, `action`
- Response: paginated logs

## Upload APIs

### `GET /api/uploads/signature`

- Auth: Yes
- Query: `publicId?` (optional deterministic public_id to sign for update flows)
- Response: signed Cloudinary payload with `timestamp`, `signature`, `apiKey`, `cloudName`, `folder`, `publicId` (if provided)
- Notes:
  - Client computes deterministic `publicId` using `buildUploadPublicId(expenseName)` before requesting signature.
  - Signature endpoint creates a signature that allows upload with the specified `public_id`.
  - Client performs client-side compression before upload if file > 5MB.

## Data Portability APIs

### `GET /api/export?format=json|csv`

- Auth: Yes
- Response: `{ data, filename, mimeType, exportedAt }`
- Includes expenses, logs, analytics metadata

### `POST /api/import`

- Auth: Yes
- Body: structured JSON payload
- Response: `{ message }`

## Error Responses

- Common status codes: `400`, `401`, `404`, `409`, `500`
- Shape: `{ success: false, error: { message, code, details? } }`

## Utility Functions (Client-Side)

### DateTime Utilities (`src/lib/datetime.ts`)

- `getLocalDateTimeInputValue(date?)`: returns `datetime-local` input-compatible string (timezone-safe).
- `toUtcIsoString(input)`: converts `datetime-local` input string to UTC ISO string.
- `formatDateTime(value, locale, timeZone)`: formats as "HH:MM • DD Mon YYYY".
- `getPresetDateRange(preset)`: returns `{ from, to }` for `this_week`, `this_month`, `this_year`.

### Export & Upload Naming (`src/lib/naming.ts`)

- `buildTimestampedFilename({ baseName, extension, timestamp? })`: returns `base_name_1234567890.ext`.
- `buildUploadPublicId(expenseName, timestamp?)`: returns deterministic `expense_name_1234567890` for Cloudinary.

### Image Compression (`src/lib/uploads/client.ts`)

- `compressImageIfNeeded(file)`: client-side canvas compression for files > 5MB; preserves acceptable quality.
