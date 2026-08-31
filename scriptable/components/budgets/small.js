// ─────────────────────────────────────────────────────────────────────────────
// components/budgets/small.js
// Small (1x1): single hero compact, icon + spent/pct only
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");
const shared = importModule("components/shared");
const errorComp = importModule("components/error");

const { t } = theme;
const { font } = layout;
const { budgetBar } = shared;

module.exports = { renderSmall };

function renderSmall(widget, { bucket, bucketBudgets, categoryBudgets }) {
  const pick = bucketBudgets[0] || categoryBudgets[0];
  if (!pick) return errorComp.renderNoData(widget, "No budget");
  const icon = widget.addText(bucket.icon || "💰");
  icon.font = font("regular", 16);
  icon.centerAlignText();
  widget.addSpacer(4);
  const title = widget.addText(bucket.name || "Budget");
  title.font = font("semibold", 11);
  title.textColor = t("text");
  title.centerAlignText();
  title.lineLimit = 1;
  widget.addSpacer(6);
  const amt = widget.addText(`${moneyLib.compact(pick.spent)} / ${moneyLib.compact(pick.amount)}`);
  amt.font = font("regular", 9);
  amt.textColor = t("muted");
  amt.centerAlignText();
  widget.addSpacer(6);
  budgetBar(widget, { pct: pick.pct, spent: pick.spent, target: pick.amount, width: 120 });
  widget.addSpacer(4);
  const pct = widget.addText(`${Math.round(pick.pct)}%`);
  pct.font = font("bold", 11);
  pct.textColor = pick.pct >= 100 ? t("danger") : t("success");
  pct.centerAlignText();
  return widget;
}
