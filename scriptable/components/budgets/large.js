// ─────────────────────────────────────────────────────────────────────────────
// components/budgets/large.js
// Large (4x2): hero + up to 3 category cards, full width 340
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const budgetsComp = importModule("components/budgets/rectangular");

const { t } = theme;
const { font } = layout;
const { budgetHeroCard, budgetCard } = budgetsComp;

module.exports = { renderLarge };

function renderLarge(widget, { bucket, bucketName, bucketBudgets, categoryBudgets }) {
  const width = 340;
  for (let i = 0; i < bucketBudgets.length; i++) {
    const b = bucketBudgets[i];
    budgetHeroCard(widget, {
      title: bucketName,
      emoji: bucket.icon || "💰",
      period: b.period,
      spent: b.spent,
      target: b.amount,
      pct: b.pct,
      width,
      compactMode: false,
    });
    if (i < bucketBudgets.length - 1 || categoryBudgets.length) widget.addSpacer(10);
  }
  if (categoryBudgets.length) {
    const sep = widget.addText("Top category budgets");
    sep.font = font("semibold", 10);
    sep.textColor = t("muted");
    widget.addSpacer(5);
    for (let i = 0; i < categoryBudgets.length; i++) {
      const b = categoryBudgets[i];
      budgetCard(widget, {
        title: b.categoryName || "Category",
        emoji: b.categoryEmoji,
        indicatorColor: b.categoryColor,
        period: b.period,
        spent: b.spent,
        target: b.amount,
        pct: b.pct,
        width,
        compactMode: false,
      });
      if (i < categoryBudgets.length - 1) widget.addSpacer(6);
    }
  }
  return widget;
}
