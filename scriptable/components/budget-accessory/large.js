// ─────────────────────────────────────────────────────────────────────────────
// components/budget-accessory/large.js
// Large widget (4x2): spacious header, big numbers, bar, Day + period
// Width ~320pt, uses hero-style large fonts
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

module.exports = { renderLarge };

function renderLarge(widget, { bucket, budget }) {
  const period = budget.period || "monthly";
  const { currentDay, totalDays } = budgetPeriodProgress(period);

  // Header
  const header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();
  const icon = header.addText(bucket.icon || "💰");
  icon.font = font("regular", 18);
  header.addSpacer(8);
  const title = header.addText(bucket.name || "Budget");
  title.font = font("semibold", 16);
  title.textColor = t("text");
  header.addSpacer();
  const pill = header.addText(period);
  pill.font = font("regular", 10);
  pill.textColor = t("muted");
  widget.addSpacer(12);

  // Big spent of target
  const line1 = widget.addStack();
  line1.layoutHorizontally();
  line1.centerAlignContent();
  const spentStr = widget.addText(moneyLib.compact(budget.spent));
  // Reuse budgetOverview style? Keep simple
  const left = line1.addText(
    `${moneyLib.compact(budget.spent)} of ${moneyLib.compact(budget.amount)}`,
  );
  left.font = font("bold", 22);
  left.textColor = budget.pct >= 100 ? t("danger") : t("success");
  line1.addSpacer();
  const pct = line1.addText(`${Math.round(budget.pct)}%`);
  pct.font = font("semibold", 18);
  pct.textColor = budget.pct >= 100 ? t("danger") : t("text");
  widget.addSpacer(10);
  budgetBallTrack(widget, {
    pct: budget.pct,
    spent: budget.spent,
    target: budget.amount,
    width: 320,
  });
  widget.addSpacer(10);
  const footer = widget.addStack();
  footer.layoutHorizontally();
  const day = footer.addText(`Day ${currentDay} of ${totalDays}`);
  day.font = font("regular", 11);
  day.textColor = t("muted");
  footer.addSpacer();
  const per = footer.addText(String(period));
  per.font = font("regular", 10);
  per.textColor = t("muted");
  return widget;
}
