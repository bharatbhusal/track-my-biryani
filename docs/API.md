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
- Query: `page`, `limit`, `q`, `categoryId`, `sortBy`, `order`
- Response: paginated expense list

### `POST /api/expenses`
- Auth: Yes
- Body: `{ title, amount, categoryId, images[], location, currency, dateTime }`
- Validation: Zod `expenseSchema`
- Response: created expense

### `PUT /api/expenses/:id`, `DELETE /api/expenses/:id`
- Auth: Yes
- Response: updated entity or deletion confirmation

## Category APIs
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

## Analytics & Logs APIs
### `GET /api/dashboard`
- Auth: Yes
- Response: totals, trends, breakdowns, recent activity

### `GET /api/logs`
- Auth: Yes
- Query: `page`, `limit`, `action`
- Response: paginated logs

## Upload APIs
### `GET /api/uploads/signature`
- Auth: Yes
- Response: signed Cloudinary payload (`timestamp`, `signature`, `apiKey`, `cloudName`, `folder`)

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
