# Scriptable Widgets — Track My Biryani

Scriptable iOS widgets for Track My Biryani. The widgets are a pure client:
they talk to the Track My Biryani API and render whatever the API returns, with
no data stored on the device. Login, cookies, requests, layout and formatting
live in the shared modules under `lib/` and `api/`; each script in `widgets/`
is just a small file that fetches data and draws a `ListWidget`.

Six widget scripts ship:

- `month-overview.js` — monthly spend vs projected
- `category-breakdown.js` — top categories by spend share
- `recent-expenses.js` — latest expenses
- `daily-trend.js` — last 7 days of spend
- `bucket-summary.js` — one bucket's month at a glance
- `accessory.js` — a catch-all lock-screen accessory

## Prerequisites

- An iPhone with iOS 17 or later.
- The Scriptable app from the App Store (free).
- The Track My Biryani server running and reachable from the phone — the web
  app in the same Wi-Fi network for local development, or the public site.
- Your Track My Biryani username and password.

## Install

1. Install Scriptable and open it once so it creates its folder in iCloud
   Drive.
2. Copy the whole `scriptable/` folder from this repo into
   `iCloud Drive > Scriptable/` (via the Files app on the iPhone, or the
   iCloud Drive folder on a Mac). `config.js`, `lib/`, `api/` and `widgets/`
   must sit directly under `Scriptable/`:

   ```text
   Scriptable/
   ├── config.js
   ├── lib/
   │   ├── bootstrap.js
   │   ├── components.js
   │   ├── date.js
   │   ├── debug.js
   │   ├── format.js
   │   ├── keychain.js
   │   ├── layout.js
   │   ├── money.js
   │   ├── theme.js
   │   └── _selfcheck.js
   ├── api/
   │   ├── auth.js
   │   ├── client.js
   │   └── endpoints.js
   └── widgets/
       ├── month-overview.js
       ├── category-breakdown.js
       ├── recent-expenses.js
       ├── daily-trend.js
       ├── bucket-summary.js
       └── accessory.js
   ```

3. Scripts import each other with `importModule` paths like `api/client` and
   `lib/theme`, which resolve relative to the running script. Mirroring the
   tree above is what makes those imports work — do not flatten the folders.

## First run: credentials

The first time any widget script runs, Scriptable shows an alert asking for
your Track My Biryani username and password (`keychain.ensureCredentials`).
Both are stored in the iOS Keychain, and the auth cookie returned by the API
is stored in the Keychain too, so later runs log in silently.

To reset the credentials: set `RESET_CREDENTIALS: true` in `config.js`, run
any widget script once (stored credentials are deleted), then set it back to
`false`. The next run prompts for credentials again.

To test a script, open the Scriptable app, pick the script, and tap the play
button — the widget preview renders and any `DEBUG` logs print to the
Scriptable console.

## config.js reference

| Key | Default | Meaning | Notes |
|---|---|---|---|
| `BASE_URL` | `http://localhost:3000/api` | API base URL the widgets call | For production change the value to `https://trackmybiryani.bharatbhusal.com/api` (also noted in a comment above the key). |
| `WEBSITE_URL` | `http://localhost:3000` | Web app base URL, used to open the app from a widget | Production: `https://trackmybiryani.bharatbhusal.com`. |
| `KEYS` | `{ USERNAME: "tmb_username", PASSWORD: "tmb_password", AUTH_COOKIE: "tmb_auth" }` | Keychain key names for credentials and the auth cookie | Leave alone unless you know what you're doing. |
| `BUCKET_HEADER` | `x-bucket-id` | HTTP header that selects the bucket for a request | Sent only when a bucket id is supplied (bucket-summary). |
| `RESET_CREDENTIALS` | `false` | `true` deletes stored credentials on the next run so the app re-prompts | Set to `true`, run a script once, set back to `false`. |
| `DEBUG` | `true` | Prints request logs to the Scriptable console | Set `false` to silence. |
| `REFRESH_MINUTES` | `15` | Widget refresh interval (`refreshAfterDate`) | iOS decides the actual refresh timing; this is the minimum. |
| `REQUEST_TIMEOUT` | `15` | Request timeout in seconds | |

### A note on HTTP

The API client sets `allowInsecureRequest = true`, so plain-HTTP URLs work —
fine for widgets talking to your server on the home network. For anything
else, switch `BASE_URL` (and `WEBSITE_URL`) to the HTTPS production URLs.
Prefer HTTPS wherever possible.

## Adding widgets to the Home Screen

1. Long-press an empty area of the Home Screen until the icons jiggle.
2. Tap **Edit** (top-left), then **Add Widget**.
3. Search for **Scriptable** and tap it.
4. Pick a size, tap **Add Widget**, then **Done**.
5. Long-press the placed widget, tap **Edit Widget**, and set **Script** to the
   script you want.

Size guidance: small shows a single headline stat; medium fits a header plus a
few rows; large fits the full layout (and `extraLarge` on iPad); the
lock-screen accessory slots take the accessory scripts.

## Widget reference

| Script | Shows | Families | Widget parameter | Example |
|---|---|---|---|---|
| `month-overview.js` | Month spend total, per-day, month progress, projected month-end | small, medium, large, accessory\* | — | "₹31,127 · ₹1,004/day" |
| `category-breakdown.js` | Top categories by spend share with percent bars | small, medium, large, accessory\* | — | "Food 42%" |
| `recent-expenses.js` | Latest 5 expenses with day labels | medium, large | — | "🍜 Biryani ₹450 Yesterday" |
| `daily-trend.js` | Last 7 days of spend | medium, large, accessory\* | — | "7d ₹8,900" |
| `bucket-summary.js` | One bucket's month total, per-day, month progress | small, medium, large, extraLarge, accessory\* | bucket id — empty for Personal | "Family ₹22,400" |
| `accessory.js` | Month total + spend per day, lock-screen style | accessory\* only (inline, circular, rectangular) | — | "💸 ₹31,127 this month" |

\* accessory = the lock-screen accessory families (inline, circular,
rectangular). `accessory.js` renders only in accessory slots and shows an
empty widget on the Home Screen — place it on the lock screen. The other
scripts draw a compact variant for accessory slots.

The emoji in the examples (🍜, 💸, …) are the app's own category and section
icons, which the widgets display in their headers.

## Widget parameter (bucket select)

On iOS 17+, **Edit Widget → Parameter** lets you pass a short text to a
widget. `bucket-summary.js` reads it as a bucket id: set it to a bucket's id
to show that bucket, or leave it empty for your Personal bucket.

Known bucket ids on the dev API (these are demo ids and change per
environment — find yours in the app, or from `GET /buckets` on your own
server):

| Bucket | Id |
|---|---|
| Personal | `6a70e131b98358f807176c20` |
| Family | `6a70e479874174a3ceb7e673` |
| Goa | `6a714e9fb2604800842eba66` |
| Nepal Trip | `6a714f15b2604800842eba72` |

## Troubleshooting

- **Nothing shows** — check the logs: `DEBUG: true` in `config.js` prints
  request logs to the Scriptable console (open the script in the app and run
  it). A failed request logs its path before the error widget renders.
- **"Login failed"** — wrong credentials. Set `RESET_CREDENTIALS: true` in
  `config.js`, run the script once, set it back to `false`, and enter the
  correct credentials when prompted.
- **Widget can't reach the server** — `BASE_URL` is wrong, the server isn't on
  the same network, or iOS blocked the plain-HTTP request. Use the HTTPS
  production URL for anything outside your home network.
- **Stale data** — widgets refresh on `REFRESH_MINUTES` (15 minutes by
  default). iOS may defer the refresh; opening the Scriptable app and running
  the script forces one.
- **Accessory widget is blank** — some scripts are accessory-only and some are
  Home-Screen-only. `accessory.js` renders only in lock-screen slots; the
  others render nothing useful in a slot they don't support. Pick a script
  that matches the slot.
- **Error widget** — `bootstrap` renders an error widget with a short hint
  ("Check DEBUG logs. Set RESET_CREDENTIALS=true …"). Read the full message
  from the Scriptable console.

## Development notes

- `node lib/_selfcheck.js` (run from the `scriptable/` folder) verifies the
  pure libs — `money`, `date`, `format` — and prints `selfcheck OK`.
- `node --check <file>` syntax-checks any script.
- The theme system (`lib/theme`) uses `Color.dynamic(light, dark)` for every
  color, so widgets adapt to light/dark appearance automatically
  (`Device.isUsingDarkAppearance()` does not work in widgets).
- Widgets use a transparent background (`Color.clear()`); on iOS 17 widgets
  tint automatically in glass modes.
- Widgets build on `bootstrap.run()`: it ensures a session, calls your build
  function, sets `refreshAfterDate`, presents the widget in the app, and
  renders an error widget on failure. Widget scripts never touch
  `Script`, `Request`, cookies or login directly.
