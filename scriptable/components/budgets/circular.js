// ─────────────────────────────────────────────────────────────────────────────
// components/budgets/circular.js
// Circular accessory: tiny, just icon + top pct
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");

const { t } = theme;
const { font } = layout;

module.exports = { renderCircular };

function renderCircular(widget, { bucket, bucketBudgets, categoryBudgets }) {
  const pick = bucketBudgets[0] || categoryBudgets[0];
  widget.addSpacer();
  const icon = widget.addText(bucket.icon || "💰");
  icon.font = font("regular", 16);
  icon.centerAlignText();
  widget.addSpacer(2);
  if (pick) {
    const pct = widget.addText(`${Math.round(pick.pct)}%`);
    pct.font = font("bold", 13);
    pct.textColor = pick.pct >= 100 ? t("danger") : t("success");
    pct.centerAlignText();
  } else {
    const e = widget.addText("—");
    e.font = font("regular", 12);
    e.textColor = t("muted");
    e.centerAlignText();
  }
  widget.addSpacer();
  return widget;
}
