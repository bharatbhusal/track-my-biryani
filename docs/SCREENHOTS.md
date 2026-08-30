# Screenshots & UI Walkthrough

Mobile (phone) screenshots of every page in **Track My Biryani**, captured at a
**390 × 844** viewport (iPhone 12/13). The app is designed mobile-first and is
not responsive at tablet/desktop widths, so all shots are phone-sized and
viewport-only.

## Running the app

```bash
npm install
npm run dev      # http://localhost:3000
```

Log in at `/auth/login` with your account (used here: `bharatbhusal`). All
authenticated pages below were captured while logged in.

## Pages

### Landing — `/home`

![Landing](/public/assets/home.png)

- **How to get there:** visit `/` (or `/home`) — this is the public marketing
  page, no login required.
- **What it shows:** the "Track My Biryani" hero, a feature list (Dashboard,
  Expenses, Categories, Analytics), and **Get Started** / **Log in** buttons.

### Login — `/auth/login`

![Login](/public/assets/login.png)

- **How to get there:** `/auth/login`, or the **Log in** button on the landing
  page; also the redirect target for protected routes when logged out.
- **What it shows:** a card with `Username` and `Password` fields and a
  **Login** button. A **Sign up** link swaps to `/auth/signup`.

### Dashboard — `/dashboard`

![Dashboard (Year range)](/public/assets/dashboard.png)

- **How to get there:** bottom navigation → **Dashboard** (also the post-login
  landing).
- **What it shows:** a `DateRangeBar` with `Day / Week / Month / Year` presets
  and prev/next period arrows, plus **Total Spend**, **Spend per Month**, a
  **Category Distribution** bar list, and a stacked **Monthly Expense** chart.
- **Interaction — switch to year range:** changed the range `Select` to
  **Year**, which aggregates the full year (₹115.6K total spend here).
- **Interaction — chart tooltip:** hovering a bar in the Monthly Expense chart
  reveals the value tooltip:

![Dashboard tooltip](/public/assets/dashboard-tooltip.png)

- **Interaction — filter by category:** tapping a category in the Category
  Distribution list filters the stacked Monthly Expense series to that
  category. (Captured in the main dashboard shot above with a category
  selected.)

### Expenses — `/expenses`

![Expenses](/public/assets/expenses.png)

- **How to get there:** bottom navigation → **Expenses**.
- **What it shows:** the list/table of recorded expenses with amount,
  category, and date; supports search/filter and opens a detail view per row.

### New Expense — `/expenses/new`

![New Expense](/public/assets/expenses-new.png)

- **How to get there:** **Quick add expense** button (bottom-right FAB) or the
  add action on the Expenses page.
- **What it shows:** the expense form — title, amount, category, date, notes,
  location, and optional photo upload (Cloudinary).

### Expense Detail — `/expenses/{id}`

![Expense Detail](/public/assets/expense-detail.png)

- **How to get there:** tap a row on `/expenses`. Example id:
  `6a3c0cb8576986b85ffc16fb`.
- **What it shows:** the full expense record with category, amount, date,
  location, notes, and attached image, plus **Edit** / delete actions.

### Edit Expense — `/expenses/{id}/edit`

![Edit Expense](/public/assets/expense-edit.png)

- **How to get there:** **Edit** on an expense detail page.
- **What it shows:** the same expense form pre-filled for editing.

### Categories — `/categories`

![Categories](/public/assets/categories.png)

- **How to get there:** bottom navigation → **Categories**.
- **What it shows:** all categories with emoji, color, and spend totals; tap a
  card to open its detail, or add a new category.

### Category Detail — `/categories/{id}`

![Category Detail](/public/assets/category-detail.png)

- **How to get there:** tap a category on `/categories`. Example id:
  `6a36be93939f5ab7f6d51f10`.
- **What it shows:** the category's emoji/color, total spend, and its expenses.

### Edit Category — `/categories/{id}/edit`

![Edit Category](/public/assets/category-edit.png)

- **How to get there:** **Edit** on a category detail page.
- **What it shows:** the category form pre-filled for editing name, emoji, and
  color.

### Settings — `/settings`

![Settings](/public/assets/settings.png)

- **How to get there:** bottom navigation → **Settings**.
- **What it shows:** theme (light/dark via `next-themes`), currency/locale
  preferences, data export (JSON), and account/session options.

## Tips

- **Theme toggle:** use Settings to switch light/dark; the preference persists.
- **Date-range presets:** on the Dashboard, the `Select` cycles `Day / Week /
Month / Year`; the chevrons step through past periods (disabled at offset 0).
- **Category filtering:** tapping a category in the Dashboard distribution list
  filters the Monthly Expense chart to that category.
- **Chart tooltips:** hover (or tap) any bar in the Monthly Expense chart to
  see the value tooltip.
- **Bottom navigation:** Dashboard / Expenses / Categories / Settings is the
  primary nav on every authenticated screen; the **Quick add expense** FAB
  opens the new-expense form from anywhere.
