// ─────────────────────────────────────────────────────────────────────────────
// components/month-overview/large.js
// Large (4x2): header + stats + bar + 6 latest + footer, full details
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");
const shared = importModule("components/shared");
const overviewComp = importModule("components/month-overview/rectangular");

const { t } = theme;
const { font } = layout;
const { moneyShort, compact } = moneyLib;
const { expenseBar } = overviewComp;
const { footer } = shared;

module.exports = { renderLarge };

function renderLarge(widget, { bucketName, expenses, total, totalSpend, month }) {
  const perDay = month.currentDay > 0 ? totalSpend / month.currentDay : 0;
  const header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();
  const title = header.addText(`This Month · ${bucketName}`);
  title.font = font("semibold", 15);
  title.textColor = t("text");
  header.addSpacer();
  const day = header.addText(`Day ${month.currentDay}/${month.daysInMonth}`);
  day.font = font("regular", 10);
  day.textColor = t("muted");
  widget.addSpacer(6);
  const stats = widget.addStack();
  stats.layoutHorizontally();
  const totalStack = stats.addStack();
  totalStack.layoutVertically();
  totalStack.addText("Total Spent").font = font("regular", 9);
  totalStack.children[0].textColor = t("muted");
  const totalValue = totalStack.addText(compact(totalSpend));
  totalValue.font = font("semibold", 15);
  totalValue.textColor = t("primary");
  stats.addSpacer();
  const perDayStack = stats.addStack();
  perDayStack.layoutVertically();
  const perDayLabel = perDayStack.addText("Per Day");
  perDayLabel.font = font("regular", 9);
  perDayLabel.textColor = t("muted");
  perDayLabel.rightAlignText();
  const perDayValue = perDayStack.addText(moneyShort(perDay));
  perDayValue.font = font("semibold", 15);
  perDayValue.textColor = t("text");
  perDayValue.rightAlignText();
  widget.addSpacer(8);
  // Progress bar
  const row = widget.addStack();
  row.layoutHorizontally();
  const totalW = 340;
  const fill = Math.round(totalW * Math.max(0, Math.min(1, month.progress)));
  const filled = row.addStack();
  filled.size = new Size(fill, 6);
  filled.cornerRadius = 3;
  filled.backgroundColor = t("accent");
  const track = row.addStack();
  track.size = new Size(totalW - fill, 6);
  track.cornerRadius = 3;
  track.backgroundColor = t("border");
  widget.addSpacer(10);
  const section = widget.addText("Latest Expenses");
  section.font = font("semibold", 11);
  section.textColor = t("text");
  widget.addSpacer(6);
  if (expenses.length === 0) {
    const empty = widget.addText("No expenses this month");
    empty.font = font("regular", 10);
    empty.textColor = t("muted");
  } else {
    const latest = expenses.slice(0, 6);
    for (let i = 0; i < latest.length; i++) {
      expenseBar(widget, latest[i]);
      if (i < latest.length - 1) widget.addSpacer(7);
    }
  }
  widget.addSpacer();
  footer(widget, { left: `${total} expenses`, right: moneyShort(totalSpend) });
  return widget;
}
