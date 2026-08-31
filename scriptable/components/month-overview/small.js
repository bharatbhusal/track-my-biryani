// ─────────────────────────────────────────────────────────────────────────────
// components/month-overview/small.js
// Small widget: total + perDay + 2 latest expenses, no bar
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

module.exports = { renderSmall };

function renderSmall(widget, { bucketName, expenses, total, totalSpend, month }) {
  const perDay = month.currentDay > 0 ? totalSpend / month.currentDay : 0;
  const header = widget.addText(`This Month · ${bucketName}`);
  header.font = font("semibold", 12);
  header.textColor = t("text");
  header.lineLimit = 1;
  widget.addSpacer(6);
  const totalLabel = widget.addText(compact(totalSpend));
  totalLabel.font = font("bold", 16);
  totalLabel.textColor = t("primary");
  totalLabel.centerAlignText();
  widget.addSpacer(2);
  const perDayLabel = widget.addText(`${moneyShort(perDay)}/day`);
  perDayLabel.font = font("regular", 9);
  perDayLabel.textColor = t("muted");
  perDayLabel.centerAlignText();
  widget.addSpacer(6);
  if (expenses.length) {
    const latest = expenses.slice(0, 2);
    for (let i = 0; i < latest.length; i++) {
      expenseBar(widget, latest[i]);
      if (i < latest.length - 1) widget.addSpacer(5);
    }
  }
  widget.addSpacer();
  footer(widget, { left: `${total} exps`, right: moneyShort(totalSpend) });
  return widget;
}
