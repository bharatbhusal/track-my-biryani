// ─────────────────────────────────────────────────────────────────────────────
// components/category-month/rectangular.js
// Category breakdown UI: bars + legend + rectangular layout for accessory.
// Uses shared safeColor helper for category colors.
// ─────────────────────────────────────────────────────────────────────────────

const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");
const shared = importModule("components/shared");

const { t } = theme;
const { font } = layout;
const { moneyShort } = moneyLib;
const { safeColor } = shared;

module.exports = { categoryBar, categoryCompactBar, stackedCategoryBar, renderRectangular };

// ─────────────────────────────────────────────────────────────────────────────
// Full row: emoji + vertical line + name + amount + %
// Used for large/medium widgets (4-10 rows)
// ─────────────────────────────────────────────────────────────────────────────
function categoryBar(parent, category, { showAmount = true } = {}) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const emoji = row.addText(category.emoji);
  emoji.font = font("regular", 14);

  row.addSpacer(6);

  const indicator = row.addStack();
  indicator.size = new Size(4, 18);
  indicator.cornerRadius = 2;
  indicator.backgroundColor = safeColor(category.color);

  row.addSpacer(7);

  const name = row.addText(category.name);
  name.font = font("regular", 10);
  name.textColor = t("text");
  name.lineLimit = 1;

  row.addSpacer();

  if (showAmount) {
    const amount = row.addText(moneyShort(category.total));
    amount.font = font("regular", 10);
    amount.textColor = t("muted");
    row.addSpacer(8);
  }

  const pct = row.addText(`${category.pct}%`);
  pct.font = font("semibold", 10);
  pct.textColor = t("text");
  pct.rightAlignText();

  return row;
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact row: emoji + tiny line + name + % (colored)
// Used for accessory widgets (top 3)
// ─────────────────────────────────────────────────────────────────────────────
function categoryCompactBar(parent, category) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const emoji = row.addText(category.emoji);
  emoji.font = font("regular", 13);

  row.addSpacer(5);

  const indicator = row.addStack();
  indicator.size = new Size(3, 14);
  indicator.cornerRadius = 1.5;
  indicator.backgroundColor = safeColor(category.color);

  row.addSpacer(5);

  const name = row.addText(category.name);
  name.font = font("regular", 9);
  name.textColor = t("text");
  name.lineLimit = 1;

  row.addSpacer();

  const pct = row.addText(`${category.pct}%`);
  pct.font = font("semibold", 9);
  pct.textColor = safeColor(category.color);

  return row;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stacked horizontal bar: segments proportional to category pct
// Width is fixed 340pt (matches budget bars), each segment gets pct slice.
// ─────────────────────────────────────────────────────────────────────────────
function stackedCategoryBar(parent, categories) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.size = new Size(0, 10);
  row.cornerRadius = 5;

  if (!categories.length) {
    row.backgroundColor = t("border");
    return row;
  }

  const totalPct = categories.reduce((sum, c) => sum + c.pct, 0);

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const segment = row.addStack();

    const width = Math.max(1, Math.round(340 * (category.pct / Math.max(totalPct, 1))));

    segment.size = new Size(width, 10);
    segment.backgroundColor = safeColor(category.color);

    if (i === 0 || i === categories.length - 1) {
      segment.cornerRadius = 5;
    }
  }

  return row;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rectangular accessory layout: top 3 categories compact, no header/stacked
// Used for Lock Screen rectangular — tight, no footer, 3 rows max.
// ─────────────────────────────────────────────────────────────────────────────
function renderRectangular(widget, { categories }) {
  if (!categories.length) {
    const empty = widget.addText("No spending");
    empty.font = font("regular", 10);
    empty.textColor = t("muted");
    empty.centerAlignText();
    return widget;
  }
  const top = categories.slice(0, 3);
  for (let i = 0; i < top.length; i++) {
    categoryCompactBar(widget, top[i]);
    if (i < top.length - 1) widget.addSpacer(4);
  }
  return widget;
}
