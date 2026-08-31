// ─────────────────────────────────────────────────────────────────────────────
// components/budget-overview-accessory/circular.js
// Circular accessory: tiny, icon + pct + perDay stacked
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");

const { t } = theme;
const { font } = layout;

module.exports = { renderCircular };

function renderCircular(widget, { bucket, budget, perDay }) {
  widget.addSpacer();
  const icon = widget.addText(bucket.icon || "💰");
  icon.font = font("regular", 14);
  icon.centerAlignText();
  widget.addSpacer(2);
  const pct = widget.addText(`${Math.round(budget.pct)}%`);
  pct.font = font("bold", 12);
  pct.textColor = budget.pct >= 100 ? t("danger") : t("success");
  pct.centerAlignText();
  widget.addSpacer(2);
  const per = widget.addText(`${moneyLib.compact(perDay)}/day`);
  per.font = font("regular", 8);
  per.textColor = t("muted");
  per.centerAlignText();
  widget.addSpacer();
  return widget;
}
