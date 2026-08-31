// ─────────────────────────────────────────────────────────────────────────────
// components/overview-accessory/small.js
// Small widget: total spend centered, single stat
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");

const { t } = theme;
const { font } = layout;
const { compact } = moneyLib;

module.exports = { renderSmall };

function renderSmall(widget, { totalSpend }) {
  widget.addSpacer();
  const label = widget.addText("THIS MONTH");
  label.font = font("semibold", 9);
  label.textColor = t("muted");
  label.centerAlignText();
  widget.addSpacer(4);
  const spend = widget.addText(compact(totalSpend));
  spend.font = font("bold", 18);
  spend.textColor = t("primary");
  spend.centerAlignText();
  widget.addSpacer(2);
  const sub = widget.addText("spent");
  sub.font = font("regular", 10);
  sub.textColor = t("muted");
  sub.centerAlignText();
  widget.addSpacer();
  return widget;
}
