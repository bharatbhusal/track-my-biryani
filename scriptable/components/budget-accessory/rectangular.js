// ─────────────────────────────────────────────────────────────────────────────
// components/budget-accessory.js
// UI for the Lock Screen rectangular budget-accessory widget.
// Renders the compact "spent of target" summary with progress ball.
// Shared budget bar primitives live in components/shared.js
// ─────────────────────────────────────────────────────────────────────────────

const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");
const shared = importModule("components/shared");

const { t } = theme;
const { font } = layout;
const { budgetBallTrack } = shared;

module.exports = { budgetSummary, renderRectangular };

// ─────────────────────────────────────────────────────────────────────────────
// Rectangular accessory layout: header + compact summary (145pt)
// Used for Lock Screen rectangular — header with icon/name/period pill
// + budgetSummary (spent of target, ball track, Day line)
// ─────────────────────────────────────────────────────────────────────────────
function renderRectangular(widget, { bucket, budget }) {
  const date = importModule("lib/date");
  const { budgetPeriodProgress } = date;
  const period = budget.period || "monthly";
  const { currentDay, totalDays } = budgetPeriodProgress(period);

  // Header: icon + bucket name left, period pill right
  const header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();
  const icon = header.addText(bucket.icon || "💰");
  icon.font = font("regular", 10);
  header.addSpacer(4);
  const title = header.addText(bucket.name || "Budget");
  title.font = font("semibold", 9);
  title.textColor = t("text");
  title.lineLimit = 1;
  header.addSpacer();
  const pill = header.addText(String(period).slice(0, 3));
  pill.font = font("regular", 7);
  pill.textColor = t("muted");

  widget.addSpacer(4);

  // Body: compact budget summary (145pt, ball hidden when over)
  budgetSummary(widget, {
    spent: budget.spent,
    target: budget.amount,
    pct: budget.pct,
    currentDay,
    totalDays,
    period: null,
    width: 145,
    compactMode: true,
  });
  return widget;
}

// ─────────────────────────────────────────────────────────────────────────────
// Budget summary (compact): line1 spent of target + %, line2 ball track,
// line3 Day X of Y + optional period. Used only by budget-accessory.
// ─────────────────────────────────────────────────────────────────────────────
function budgetSummary(
  parent,
  { spent, target, pct, currentDay, totalDays, period, width, compactMode } = {},
) {
  const spentStr = moneyLib.compact(spent);
  const targetStr = moneyLib.compact(target);
  const raw = Number(pct) || 0;
  const isOver = raw >= 100 || spent > target;
  const fillColor = isOver ? t("danger") : raw > 85 ? t("warning") : t("success");

  // Line 1: "₹39.4k of ₹50k" left, "79%" right — colored by over/warning
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
  // Line 2: progress ball track (show ball unless over budget)
  budgetBallTrack(parent, { pct: raw, spent, target, width: width || 320 });
  parent.addSpacer(7);

  // Line 3: "Day 31 of 31" left, optional period right
  if (typeof currentDay === "number" && typeof totalDays === "number") {
    const line3 = parent.addStack();
    line3.layoutHorizontally();
    line3.centerAlignContent();
    const dayLabel = line3.addText(`Day ${currentDay} of ${totalDays}`);
    dayLabel.font = font("regular", compactMode ? 9 : 10);
    dayLabel.textColor = t("muted");
    line3.addSpacer();
    if (period) {
      const periodLabel = line3.addText(String(period));
      periodLabel.font = font("regular", compactMode ? 8 : 9);
      periodLabel.textColor = t("muted");
      periodLabel.rightAlignText();
    }
  }
  return parent;
}
