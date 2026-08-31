// ─────────────────────────────────────────────────────────────────────────────
// components/budget-overview-accessory/small.js
// Small: icon + pct + perDay, ultra compact for 1x1
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");

const { t } = theme;
const { font } = layout;

module.exports = { renderSmall };

function renderSmall(widget, { bucket, budget, perDay }) {
  const icon = widget.addText(bucket.icon || "💰");
  icon.font = font("regular", 16);
  icon.centerAlignText();
  widget.addSpacer(4);
  const pct = widget.addText(`${Math.round(budget.pct)}%`);
  pct.font = font("bold", 14);
  pct.textColor = budget.pct >= 100 ? t("danger") : t("success");
  pct.centerAlignText();
  widget.addSpacer(4);
  const per = widget.addText(`${moneyLib.compact(perDay)}/day`);
  per.font = font("regular", 9);
  per.textColor = t("muted");
  per.centerAlignText();
  return widget;
}
