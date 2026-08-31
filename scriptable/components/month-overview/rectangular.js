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

module.exports = { expenseBar, renderRectangular };

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

// ─────────────────────────────────────────────────────────────────────────────
// Rectangular accessory: compact header + 2 latest expenses + footer
// Width ~145pt, no refresh, shows Day + perDay footer
// ─────────────────────────────────────────────────────────────────────────────
function renderRectangular(widget, { bucket, bucketName, expenses, total, totalSpend, month }) {
  const perDay = month.currentDay > 0 ? totalSpend / month.currentDay : 0;
  const moneyLib = importModule("lib/money");
  const shared = importModule("components/shared");
  const errorComp = importModule("components/error");
  const { footer } = shared;
  const { moneyShort, compact } = moneyLib;
  const { font } = importModule("lib/layout");
  const { t } = importModule("lib/theme");

  // Compact header: icon + bucket name left, total right
  const header = widget.addStack();
  header.layoutHorizontally();
  const icon = header.addText(bucket.icon || "📅");
  icon.font = font("regular", 10);
  header.addSpacer(4);
  const title = header.addText(bucketName);
  title.font = font("semibold", 9);
  title.textColor = t("text");
  title.lineLimit = 1;
  header.addSpacer();
  const day = header.addText(compact(totalSpend));
  day.font = font("semibold", 10);
  day.textColor = t("primary");
  day.rightAlignText();
  widget.addSpacer(4);

  // 2 latest expenses compact — empty via error component
  if (expenses.length) {
    const top = expenses.slice(0, 2);
    for (let i = 0; i < top.length; i++) {
      expenseBar(widget, top[i]);
      if (i < top.length - 1) widget.addSpacer(4);
    }
  } else {
    errorComp.renderNoData(widget, "No expenses");
  }
  widget.addSpacer();
  // Footer: Day X/Y left, perDay right
  footer(widget, { left: `Day ${month.currentDay}/${month.daysInMonth}`, right: `${moneyShort(perDay)}/day` });
  return widget;
}
