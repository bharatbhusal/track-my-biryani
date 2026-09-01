// ─────────────────────────────────────────────────────────────────────────────
// components/expenses/medium.js
// Medium (2x2): header + stats + bar + 3 latest expenses + footer
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");
const shared = importModule("components/shared");
const overviewComp = importModule("components/expenses/rectangular");
const errorComp = importModule("components/error");

const { t } = theme;
const { font } = layout;
const { moneyShort, compact } = moneyLib;
const { expenseBar } = overviewComp;
const { footer } = shared;

module.exports = { renderMedium };

function renderMedium(widget, { bucketName, expenses, total, totalSpend, month }) {
  const perDay = month.currentDay > 0 ? totalSpend / month.currentDay : 0;
  // Header
  const header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();
  const title = header.addText(`This Month · ${bucketName}`);
  title.font = font("semibold", 14);
  title.textColor = t("text");
  title.lineLimit = 1;
  header.addSpacer();
  const day = header.addText(`Day ${month.currentDay}/${month.daysInMonth}`);
  day.font = font("regular", 9);
  day.textColor = t("muted");
  widget.addSpacer(6);
  // Stats
  const stats = widget.addStack();
  stats.layoutHorizontally();
  const totalStack = stats.addStack();
  totalStack.layoutVertically();
  const totalLabel = totalStack.addText("Total Spent");
  totalLabel.font = font("regular", 9);
  totalLabel.textColor = t("muted");
  const totalValue = totalStack.addText(compact(totalSpend));
  totalValue.font = font("semibold", 14);
  totalValue.textColor = t("primary");
  stats.addSpacer();
  const perDayStack = stats.addStack();
  perDayStack.layoutVertically();
  const perDayLabel = perDayStack.addText("Per Day");
  perDayLabel.font = font("regular", 9);
  perDayLabel.textColor = t("muted");
  perDayLabel.rightAlignText();
  const perDayValue = perDayStack.addText(moneyShort(perDay));
  perDayValue.font = font("semibold", 14);
  perDayValue.textColor = t("text");
  perDayValue.rightAlignText();
  // Latest — empty state via error component
  widget.addSpacer(8);
  if (expenses.length === 0) {
    errorComp.renderNoData(widget, "No expenses");
  } else {
    const latest = expenses.slice(0, 3);
    for (let i = 0; i < latest.length; i++) {
      expenseBar(widget, latest[i]);
      if (i < latest.length - 1) widget.addSpacer(6);
    }
  }
  widget.addSpacer();
  footer(widget, { left: `${total} expenses`, right: moneyShort(totalSpend) });
  return widget;
}
