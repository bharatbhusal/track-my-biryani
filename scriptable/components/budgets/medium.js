// ─────────────────────────────────────────────────────────────────────────────
// components/budgets/medium.js
// Medium (2x2): hero + 1 category card, compactMode true
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const shared = importModule("components/shared");
const budgetsComp = importModule("components/budgets/rectangular");

const { t } = theme;
const { font } = layout;
// Reuse hero/card from rectangular component file (which holds logic)
const { budgetHeroCard, budgetCard } = budgetsComp;

module.exports = { renderMedium };

function renderMedium(widget, { bucket, bucketName, bucketBudgets, categoryBudgets }) {
  const width = 260;
  if (bucketBudgets.length) {
    budgetHeroCard(widget, {
      title: bucketName,
      emoji: bucket.icon || "💰",
      period: bucketBudgets[0].period,
      spent: bucketBudgets[0].spent,
      target: bucketBudgets[0].amount,
      pct: bucketBudgets[0].pct,
      width,
      compactMode: true,
    });
    widget.addSpacer(8);
  }
  if (categoryBudgets.length) {
    const b = categoryBudgets[0];
    budgetCard(widget, {
      title: b.categoryName || "Category",
      emoji: b.categoryEmoji,
      indicatorColor: b.categoryColor,
      period: b.period,
      spent: b.spent,
      target: b.amount,
      pct: b.pct,
      width,
      compactMode: true,
    });
  }
  return widget;
}
