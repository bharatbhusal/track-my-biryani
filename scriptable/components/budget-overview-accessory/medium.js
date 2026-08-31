// ─────────────────────────────────────────────────────────────────────────────
// components/budget-overview-accessory/medium.js
// Medium (2x2): header + spent of target + bar + Day left + perDay right
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");
const shared = importModule("components/shared");
const date = importModule("lib/date");

const { t } = theme;
const { font } = layout;
const { budgetBallTrack } = shared;
const { budgetPeriodProgress } = date;

module.exports = { renderMedium };

function renderMedium(widget, { bucket, budget, perDay }) {
  const period = budget.period || "monthly";
  const { currentDay, totalDays } = budgetPeriodProgress(period);
  const header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();
  const icon = header.addText(bucket.icon || "💰");
  icon.font = font("regular", 14);
  header.addSpacer(6);
  const title = header.addText(bucket.name || "Budget");
  title.font = font("semibold", 13);
  title.textColor = t("text");
  header.addSpacer();
  const pill = header.addText(String(period).slice(0, 3));
  pill.font = font("regular", 8);
  pill.textColor = t("muted");
  widget.addSpacer(8);
  const line1 = widget.addStack();
  line1.layoutHorizontally();
  line1.centerAlignContent();
  const left = line1.addText(`${moneyLib.compact(budget.spent)} of ${moneyLib.compact(budget.amount)}`);
  left.font = font("semibold", 14);
  left.textColor = t("text");
  line1.addSpacer();
  const pct = line1.addText(`${Math.round(budget.pct)}%`);
  pct.font = font("semibold", 12);
  pct.textColor = budget.pct >= 100 ? t("danger") : t("success");
  widget.addSpacer(6);
  budgetBallTrack(widget, { pct: budget.pct, spent: budget.spent, target: budget.amount, width: 280 });
  widget.addSpacer(8);
  const footer = widget.addStack();
  footer.layoutHorizontally();
  footer.centerAlignContent();
  const day = footer.addText(`Day ${currentDay} of ${totalDays}`);
  day.font = font("regular", 10);
  day.textColor = t("muted");
  footer.addSpacer();
  const per = footer.addText(`${moneyLib.compact(perDay)}/day`);
  per.font = font("semibold", 10);
  per.textColor = t("muted");
  per.rightAlignText();
  return widget;
}
