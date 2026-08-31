// ─────────────────────────────────────────────────────────────────────────────
// components/overview-accessory/circular.js
// Circular accessory: tiny, just total spend centered
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");

const { t } = theme;
const { font } = layout;
const { compact } = moneyLib;

module.exports = { renderCircular };

function renderCircular(widget, { totalSpend }) {
  widget.addSpacer();
  const icon = widget.addText("🥘");
  icon.font = font("regular", 14);
  icon.centerAlignText();
  widget.addSpacer(2);
  const spend = widget.addText(compact(totalSpend));
  spend.font = font("bold", 12);
  spend.textColor = t("primary");
  spend.centerAlignText();
  widget.addSpacer();
  return widget;
}
