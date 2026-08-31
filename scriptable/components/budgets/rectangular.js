// ─────────────────────────────────────────────────────────────────────────────
// components/budgets.js
// Budget widgets: hero card (bucket level) + row cards (category level)
// Used by budgets.js (large) widget. Low-level bar comes from shared.
// ─────────────────────────────────────────────────────────────────────────────

const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");
const shared = importModule("components/shared");

const { t } = theme;
const { font } = layout;
const { safeColor, capPeriod, budgetBar } = shared;

module.exports = { budgetCard, budgetHeroCard, renderRectangular };

// ─────────────────────────────────────────────────────────────────────────────
// Row card: emoji + vertical color line + name + period + target amount
// + bar + bottom spent left / % left over right
// ─────────────────────────────────────────────────────────────────────────────
function budgetCard(
  parent,
  { title, emoji, indicatorColor, period, spent, target, pct, width = 320, compactMode } = {},
) {
  const raw = Number(pct) || 0;
  const isOver = raw >= 100 || spent > target;

  // Top row: emoji, indicator line, name, period pill, target amount
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const e = row.addText(emoji || (title === "Bucket budget" ? "💰" : "🏷️"));
  e.font = font("regular", compactMode ? 13 : 14);
  row.addSpacer(6);

  const indicator = row.addStack();
  indicator.size = new Size(4, 18);
  indicator.cornerRadius = 2;
  indicator.backgroundColor = safeColor(indicatorColor || "#999999");
  row.addSpacer(7);

  const nameEl = row.addText(title || "Budget");
  nameEl.font = font("regular", compactMode ? 10 : 11);
  nameEl.textColor = t("text");
  nameEl.lineLimit = 1;
  row.addSpacer();

  if (period) {
    const per = row.addText(capPeriod(period));
    per.font = font("regular", compactMode ? 8 : 9);
    per.textColor = t("muted");
    row.addSpacer(8);
  }

  const amountEl = row.addText(moneyLib.compact(target));
  amountEl.font = font("semibold", compactMode ? 10 : 11);
  amountEl.textColor = t("text");
  amountEl.rightAlignText();

  parent.addSpacer(6);
  // Middle bar: 6pt budget bar (green / warning / red when over)
  budgetBar(parent, { pct: raw, spent, target, width, height: 6 });

  parent.addSpacer(4);
  // Bottom row: spent left vs % left / % over
  const bottom = parent.addStack();
  bottom.layoutHorizontally();
  const spentEl = bottom.addText(`${moneyLib.compact(spent)} spent`);
  spentEl.font = font("regular", compactMode ? 8 : 9);
  spentEl.textColor = t("muted");
  bottom.addSpacer();
  const leftPct = isOver ? Math.round(raw - 100) : Math.round(100 - raw);
  const rightText = isOver ? `${leftPct}% over` : `${leftPct}% left`;
  const rightEl = bottom.addText(rightText);
  rightEl.font = font(isOver ? "semibold" : "regular", compactMode ? 8 : 9);
  rightEl.textColor = isOver ? t("danger") : t("muted");
  rightEl.rightAlignText();

  return parent;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero card: large numbers for bucket budget — spent of target with %
// + thick 8pt bar + bottom remaining/over text
// ─────────────────────────────────────────────────────────────────────────────
function budgetHeroCard(
  parent,
  { title, emoji, period, spent, target, pct, width = 320, compactMode } = {},
) {
  const raw = Number(pct) || 0;
  const isOver = raw >= 100 || spent > target;
  const fillColor = isOver ? t("danger") : raw > 85 ? t("warning") : t("success");

  const hero = parent.addStack();
  hero.layoutVertically();

  // Header: emoji + title left, period caps right
  const headerRow = hero.addStack();
  headerRow.layoutHorizontally();
  headerRow.centerAlignContent();
  const e = headerRow.addText(emoji || "💰");
  e.font = font("regular", compactMode ? 14 : 16);
  headerRow.addSpacer(6);
  const nameEl = headerRow.addText(title || "Bucket Budget");
  nameEl.font = font("semibold", compactMode ? 13 : 14);
  nameEl.textColor = t("text");
  nameEl.lineLimit = 1;
  headerRow.addSpacer();
  if (period) {
    const per = headerRow.addText(capPeriod(period));
    per.font = font("semibold", 8);
    per.textColor = t("muted");
  }

  hero.addSpacer(10);

  // Big amount row: "₹330k of ₹400k  82%"
  const amountRow = hero.addStack();
  amountRow.layoutHorizontally();
  amountRow.centerAlignContent();
  const spentEl = amountRow.addText(moneyLib.compact(spent));
  spentEl.font = font("bold", compactMode ? 20 : 22);
  spentEl.textColor = fillColor;
  amountRow.addSpacer(6);
  const ofEl = amountRow.addText("of");
  ofEl.font = font("regular", compactMode ? 11 : 12);
  ofEl.textColor = t("muted");
  amountRow.addSpacer(6);
  const targetEl = amountRow.addText(moneyLib.compact(target));
  targetEl.font = font("semibold", compactMode ? 13 : 14);
  targetEl.textColor = t("text");
  amountRow.addSpacer();
  const pctEl = amountRow.addText(`${Math.round(raw)}%`);
  pctEl.font = font("semibold", compactMode ? 12 : 13);
  pctEl.textColor = fillColor;
  pctEl.rightAlignText();

  hero.addSpacer(10);
  // Thick bar
  budgetBar(hero, { pct: raw, spent, target, width: width, height: 8 });

  hero.addSpacer(6);

  const bottom = hero.addStack();
  bottom.layoutHorizontally();
  const leftPct = isOver ? Math.round(raw - 100) : Math.round(100 - raw);
  const leftText = isOver ? `${leftPct}% over budget` : `${leftPct}% remaining`;
  const leftEl = bottom.addText(leftText);
  leftEl.font = font(isOver ? "semibold" : "regular", 9);
  leftEl.textColor = isOver ? t("danger") : t("muted");
  bottom.addSpacer();
  const rightEl = bottom.addText(`${moneyLib.compact(spent)} spent`);
  rightEl.font = font("regular", 9);
  rightEl.textColor = t("muted");
  rightEl.rightAlignText();

  return hero;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rectangular accessory layout: compact single hero (145pt) for
// Lock Screen rectangular. Shows top budget only, compact mode.
// ─────────────────────────────────────────────────────────────────────────────
function renderRectangular(widget, { bucket, bucketName, bucketBudgets, categoryBudgets }) {
  const b = bucketBudgets[0] || categoryBudgets[0];
  if (!b) {
    const e = widget.addText("No budget");
    e.font = font("regular", 10);
    e.textColor = t("muted");
    e.centerAlignText();
    return widget;
  }
  // Compact hero card for 145pt rectangular accessory
  budgetHeroCard(widget, {
    title: bucketName,
    emoji: bucket.icon || "💰",
    period: b.period,
    spent: b.spent,
    target: b.amount,
    pct: b.pct,
    width: 145,
    compactMode: true,
  });
  return widget;
}
