// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: magic;
const load = (n) => (typeof require !== "undefined" ? require("./" + n + ".js") : importModule(n));

function check(cond, msg) {
  if (!cond) throw new Error(`selfcheck failed: ${msg}`);
}

const money = load("money");
const date = load("date");
const format = load("format");
const theme = load("theme");

check(
  typeof theme.t === "function" && typeof theme.background === "function",
  "theme exports t/background",
);
check(
  theme.PALETTE.text && theme.PALETTE.danger && theme.PALETTE.border,
  "theme PALETTE keys present",
);

check(money.money(31127) === "₹31,127", `money(31127) = ${money.money(31127)}`);
check(money.money(0) === "₹0", `money(0) = ${money.money(0)}`);
check(money.compact(125000) === "₹125k", `compact(125000) = ${money.compact(125000)}`);
check(money.moneyShort(31127) === "₹31,127", "moneyShort under 100k falls through to money");
check(money.compact(31127) === "₹31.1k", `compact(31127) = ${money.compact(31127)}`);
const { progress } = date.currentMonthProgress();
check(progress >= 0 && progress <= 1, `progress = ${progress}`);
check(
  date.formatDay("2026-08-05T12:00:00Z") === "05 Aug",
  `formatDay = ${date.formatDay("2026-08-05T12:00:00Z")}`,
);
check(date.relativeDay(new Date().toISOString()) === "Today", "relativeDay(today) = Today");
check(
  date.formatClock(new Date(2026, 7, 5, 22, 30)) === "10:30 PM",
  `formatClock = ${date.formatClock(new Date(2026, 7, 5, 22, 30))}`,
);
check(
  date.formatClock24(new Date(2026, 7, 5, 22, 4)) === "22:04",
  `formatClock24 = ${date.formatClock24(new Date(2026, 7, 5, 22, 4))}`,
);
check(
  date.formatClock24(new Date(2026, 7, 5, 9, 5)) === "09:05",
  `formatClock24 pad = ${date.formatClock24(new Date(2026, 7, 5, 9, 5))}`,
);
check(date.projectSpend(500, 31) === 15500, "projectSpend");
check(format.blockBar(1).length === 16, "blockBar(1) length");
check(format.blockBar(0) === "░".repeat(16), "blockBar(0) all hollow");
check(format.pct(0.4237) === "42%", `pct = ${format.pct(0.4237)}`);
check(format.truncate("abcdefgh", 5) === "abcde…", `truncate = ${format.truncate("abcdefgh", 5)}`);
check(format.pluralize(2, "expense") === "2 expenses", "pluralize plural");
check(format.pluralize(1, "expense") === "1 expense", "pluralize singular");

console.log("selfcheck OK");
