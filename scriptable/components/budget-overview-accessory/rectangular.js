// ─────────────────────────────────────────────────────────────────────────────
// components/budget-overview-accessory.js
// Combined budget + overview accessory: same compact layout as
// budget-accessory, but bottom line shows "Day X of Y" left + "590/day" right.
// Reuses shared budgetBallTrack for the progress ball.
// ─────────────────────────────────────────────────────────────────────────────

const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");
const shared = importModule("components/shared");

const { t } = theme;
const { font } = layout;
const { budgetBallTrack } = shared;

module.exports = { budgetOverviewSummary };

// ─────────────────────────────────────────────────────────────────────────────
// Budget + per-day summary: spent of target + % on line1,
// ball track on line2, Day X/Y left + perDay right on line3.
// perDay is formatted compact (e.g. ₹590) + "/day"
// ─────────────────────────────────────────────────────────────────────────────
function budgetOverviewSummary(
  parent,
  { spent, target, pct, currentDay, totalDays, perDay, width, compactMode } = {},
) {
  const spentStr = moneyLib.compact(spent);
  const targetStr = moneyLib.compact(target);
  const raw = Number(pct) || 0;
  const isOver = raw >= 100 || spent > target;
  const fillColor = isOver ? t("danger") : raw > 85 ? t("warning") : t("success");

  // Line 1: spent of target left, % right
  const line1 = parent.addStack();
  line1.layoutHorizontally();
  line1.centerAlignContent();
  const left = line1.addText(`${spentStr} of ${targetStr}`);
  left.font = font("semibold", compactMode ? 13 : 15);
  left.textColor = t("text");
  left.lineLimit = 1;
  line1.addSpacer();
  const right = line1.addText(`${Math.round(raw)}%`);
  right.font = font("semibold", compactMode ? 11 : 12);
  right.textColor = fillColor;
  right.rightAlignText();

  parent.addSpacer(7);
  // Line 2: ball track (width 145 for accessory)
  budgetBallTrack(parent, { pct: raw, spent, target, width: width || 340 });
  parent.addSpacer(7);

  // Line 3: Day X of Y left, perDay right (e.g. "₹590/day")
  if (typeof currentDay === "number" && typeof totalDays === "number") {
    const line3 = parent.addStack();
    line3.layoutHorizontally();
    line3.centerAlignContent();
    const dayLabel = line3.addText(`Day ${currentDay} of ${totalDays}`);
    dayLabel.font = font("regular", compactMode ? 9 : 10);
    dayLabel.textColor = t("muted");
    line3.addSpacer();
    // Per-day on right — compact money + "/day" suffix, muted color
    const perDayStr = perDay != null ? `${moneyLib.compact(perDay)}/day` : "";
    if (perDayStr) {
      const perDayLabel = line3.addText(perDayStr);
      perDayLabel.font = font("semibold", compactMode ? 9 : 10);
      perDayLabel.textColor = t("muted");
      perDayLabel.rightAlignText();
    }
  }
  return parent;
}
