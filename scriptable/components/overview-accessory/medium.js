// ─────────────────────────────────────────────────────────────────────────────
// components/overview-accessory/medium.js
// Medium widget: total left, perDay right, 2x2 stats
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");

const { t } = theme;
const { font } = layout;
const { compact } = moneyLib;

module.exports = { renderMedium };

function renderMedium(widget, { totalSpend, perDay }) {
  widget.addSpacer(4);
  const header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();
  const icon = header.addText("🥘");
  icon.font = font("regular", 16);
  header.addSpacer(6);
  const title = header.addText("This Month");
  title.font = font("semibold", 14);
  title.textColor = t("text");
  widget.addSpacer(12);
  const row = widget.addStack();
  row.layoutHorizontally();
  const left = row.addStack();
  left.layoutVertically();
  left.addText("Total Spent").font = font("regular", 10);
  left.children[0].textColor = t("muted");
  const leftVal = left.addText(compact(totalSpend));
  leftVal.font = font("bold", 16);
  leftVal.textColor = t("primary");
  row.addSpacer();
  const right = row.addStack();
  right.layoutVertically();
  const rl = right.addText("Per Day");
  rl.font = font("regular", 10);
  rl.textColor = t("muted");
  rl.rightAlignText();
  const rv = right.addText(compact(perDay));
  rv.font = font("semibold", 16);
  rv.textColor = t("text");
  rv.rightAlignText();
  widget.addSpacer();
  return widget;
}
