// ─────────────────────────────────────────────────────────────────────────────
// components/category-month/small.js
// Small widget (1x1): top 2 categories compact + stacked bar, no footer
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const catComp = importModule("components/category-month/rectangular");

const { t } = theme;
const { font } = layout;
const { categoryCompactBar, stackedCategoryBar } = catComp;

module.exports = { renderSmall };

// Small: compact, 2 categories max, stacked bar on top
function renderSmall(widget, { categories }) {
  if (!categories.length) {
    const e = widget.addText("No spending");
    e.font = font("regular", 10);
    e.textColor = t("muted");
    e.centerAlignText();
    return widget;
  }
  // Tiny stacked bar
  stackedCategoryBar(widget, categories);
  widget.addSpacer(6);
  const top = categories.slice(0, 2);
  for (let i = 0; i < top.length; i++) {
    categoryCompactBar(widget, top[i]);
    if (i < top.length - 1) widget.addSpacer(4);
  }
  return widget;
}
