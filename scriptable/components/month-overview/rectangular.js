// ─────────────────────────────────────────────────────────────────────────────
// components/month-overview.js
// Expense list row for month-overview widget (latest expenses)
// Includes emoji, color indicator, title, relative day, amount
// ─────────────────────────────────────────────────────────────────────────────

const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");
const date = importModule("lib/date");
const shared = importModule("components/shared");

const { t } = theme;
const { font } = layout;
const { moneyShort } = moneyLib;
const { relativeDay } = date;
const { safeColor } = shared;

module.exports = { expenseBar };

// ─────────────────────────────────────────────────────────────────────────────
// Row: emoji | 5pt color line | title (flex) | relativeDay | amount
// Matches Figma expense row — compact but readable for 6 items.
// ─────────────────────────────────────────────────────────────────────────────
function expenseBar(parent, expense) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const emoji = row.addText(expense.categoryEmoji || "💸");
  emoji.font = font("regular", 15);

  row.addSpacer(7);

  const indicator = row.addStack();
  indicator.size = new Size(5, 22);
  indicator.cornerRadius = 2.5;
  indicator.backgroundColor = safeColor(expense.categoryColor || "#999999");

  row.addSpacer(7);

  const title = row.addText(expense.title || "Expense");
  title.font = font("regular", 11);
  title.textColor = t("text");
  title.lineLimit = 1;

  row.addSpacer();

  const paidAt = row.addText(relativeDay(expense.paidAt));
  paidAt.font = font("regular", 10);
  paidAt.textColor = t("muted");

  row.addSpacer(8);

  const amount = row.addText(moneyShort(Number(expense.amount) || 0));
  amount.font = font("semibold", 11);
  amount.textColor = t("text");
  amount.rightAlignText();

  return row;
}
