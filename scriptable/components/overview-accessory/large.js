// ─────────────────────────────────────────────────────────────────────────────
// components/overview-accessory/large.js
// Large widget: big header, total + perDay + expense count
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");

const { t } = theme;
const { font } = layout;
const { compact } = moneyLib;

module.exports = { renderLarge };

function renderLarge(widget, { totalSpend, perDay, expenseCount }) {
  const header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();
  const icon = header.addText("🥘");
  icon.font = font("regular", 18);
  header.addSpacer(6);
  const title = header.addText("This Month");
  title.font = font("semibold", 16);
  title.textColor = t("text");
  widget.addSpacer(12);
  const totalRow = widget.addStack();
  totalRow.layoutHorizontally();
  totalRow.centerAlignContent();
  const total = totalRow.addText(compact(totalSpend));
  total.font = font("bold", 26);
  total.textColor = t("primary");
  totalRow.addSpacer(8);
  const spent = totalRow.addText("spent");
  spent.font = font("regular", 12);
  spent.textColor = t("muted");
  widget.addSpacer(8);
  const perRow = widget.addStack();
  perRow.layoutHorizontally();
  perRow.centerAlignContent();
  const per = perRow.addText(compact(perDay));
  per.font = font("semibold", 14);
  per.textColor = t("text");
  perRow.addSpacer(6);
  const perLabel = perRow.addText("/ day");
  perLabel.font = font("regular", 11);
  perLabel.textColor = t("muted");
  perRow.addSpacer();
  if (expenseCount != null) {
    const count = perRow.addText(`${expenseCount} expenses`);
    count.font = font("regular", 10);
    count.textColor = t("muted");
    count.rightAlignText();
  }
  widget.addSpacer();
  return widget;
}
