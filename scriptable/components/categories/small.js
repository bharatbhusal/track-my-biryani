// ─────────────────────────────────────────────────────────────────────────────
// components/categories/small.js
// Small widget (1x1): top 2 categories compact + stacked bar, no footer
// ─────────────────────────────────────────────────────────────────────────────
const catComp = importModule("components/categories/rectangular");
const errorComp = importModule("components/error");

const { categoryCompactBar, stackedCategoryBar } = catComp;

module.exports = { renderSmall };

// Small: compact, 2 categories max, stacked bar on top
function renderSmall(widget, { categories }) {
  if (!categories.length) return errorComp.renderNoData(widget, "No spending");
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
