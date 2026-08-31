// ─────────────────────────────────────────────────────────────────────────────
// components/expenses/circular.js
// Circular accessory: tiny, just total spend centered + bucket icon
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");

const { t } = theme;
const { font } = layout;
const { compact } = moneyLib;

module.exports = { renderCircular };

function renderCircular(widget, { bucket, totalSpend }) {
  widget.addSpacer();
  const icon = widget.addText(bucket.icon || "📁");
  icon.font = font("regular", 16);
  icon.centerAlignText();
  widget.addSpacer(2);
  const total = widget.addText(compact(totalSpend));
  total.font = font("bold", 13);
  total.textColor = t("primary");
  total.centerAlignText();
  widget.addSpacer();
  return widget;
}
