// ─────────────────────────────────────────────────────────────────────────────
// components/budget-accessory/small.js
// Small widget layout: icon top, spent/target compact, bar, pct badge
// Width ~150pt, tight spacing for 1x1 tile.
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");
const shared = importModule("components/shared");

const { t } = theme;
const { font } = layout;
const { budgetBar } = shared;

module.exports = { renderSmall };

// Small: icon + name (1 line), spent of target, progress bar, % centered
function renderSmall(widget, { bucket, budget }) {
  // Icon + name
  const icon = widget.addText(bucket.icon || "💰");
  icon.font = font("regular", 18);
  icon.centerAlignText();
  widget.addSpacer(4);
  const name = widget.addText(bucket.name || "Budget");
  name.font = font("semibold", 11);
  name.textColor = t("text");
  name.centerAlignText();
  name.lineLimit = 1;
  widget.addSpacer(6);
  // Amount
  const amount = widget.addText(`${moneyLib.compact(budget.spent)} / ${moneyLib.compact(budget.amount)}`);
  amount.font = font("regular", 9);
  amount.textColor = t("muted");
  amount.centerAlignText();
  widget.addSpacer(6);
  // Bar (110pt for small)
  budgetBar(widget, { pct: budget.pct, spent: budget.spent, target: budget.amount, width: 110, height: 6 });
  widget.addSpacer(6);
  const pct = widget.addText(`${Math.round(budget.pct)}%`);
  pct.font = font("bold", 12);
  pct.textColor = budget.pct >= 100 ? t("danger") : budget.pct > 85 ? t("warning") : t("success");
  pct.centerAlignText();
  return widget;
}
