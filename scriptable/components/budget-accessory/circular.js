// ─────────────────────────────────────────────────────────────────────────────
// components/budget-accessory/circular.js
// Circular accessory (tiny): icon centered + pct below — no bar, no text wrap
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");

const { t } = theme;
const { font } = layout;

module.exports = { renderCircular };

function renderCircular(widget, { bucket, budget }) {
  widget.addSpacer();
  const icon = widget.addText(bucket.icon || "💰");
  icon.font = font("regular", 16);
  icon.centerAlignText();
  widget.addSpacer(2);
  const pct = widget.addText(`${Math.round(budget.pct)}%`);
  pct.font = font("bold", 13);
  pct.textColor = budget.pct >= 100 ? t("danger") : budget.pct > 85 ? t("warning") : t("success");
  pct.centerAlignText();
  widget.addSpacer();
  return widget;
}
