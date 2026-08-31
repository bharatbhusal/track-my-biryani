// ─────────────────────────────────────────────────────────────────────────────
// components/overview-accessory/rectangular.js
// Rectangular accessory layout: 🥘 THIS MONTH + total + perDay
// Compact 145pt, no refresh footer, used for Lock Screen rectangular.
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");

const { t } = theme;
const { font } = layout;
const { compact } = moneyLib;

module.exports = { renderRectangular };

function renderRectangular(widget, { totalSpend, perDay }) {
  const header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();
  const icon = header.addText("🥘");
  icon.font = font("regular", 12);
  header.addSpacer(5);
  const title = header.addText("THIS MONTH");
  title.font = font("semibold", 9);
  title.textColor = t("text");
  widget.addSpacer(2);
  const spendRow = widget.addStack();
  spendRow.layoutHorizontally();
  spendRow.centerAlignContent();
  const spend = spendRow.addText(compact(totalSpend));
  spend.font = font("semibold", 17);
  spend.textColor = t("primary");
  spendRow.addSpacer(5);
  const spentLabel = spendRow.addText("spent");
  spentLabel.font = font("regular", 9);
  spentLabel.textColor = t("muted");
  const dayRow = widget.addStack();
  dayRow.layoutHorizontally();
  dayRow.centerAlignContent();
  const perDayValue = dayRow.addText(compact(perDay));
  perDayValue.font = font("semibold", 10);
  perDayValue.textColor = t("text");
  dayRow.addSpacer(4);
  const perDayLabel = dayRow.addText("/ day");
  perDayLabel.font = font("regular", 9);
  perDayLabel.textColor = t("muted");
  return widget;
}
