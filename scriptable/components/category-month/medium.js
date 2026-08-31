// ─────────────────────────────────────────────────────────────────────────────
// components/category-month/medium.js
// Medium (2x2): header + stacked bar + 4 category rows + footer
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");
const shared = importModule("components/shared");
const catComp = importModule("components/category-month/rectangular");
const errorComp = importModule("components/error");

const { t } = theme;
const { font } = layout;
const { moneyShort } = moneyLib;
const { footer } = shared;
const { categoryBar, stackedCategoryBar } = catComp;

module.exports = { renderMedium };

function renderMedium(widget, { bucketName, categories, totalSpend }) {
  // Header
  const header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();
  const title = header.addText(`Where It Went · ${bucketName}`);
  title.font = font("semibold", 14);
  title.textColor = t("text");
  title.lineLimit = 1;
  header.addSpacer();
  const sub = header.addText("This Month");
  sub.font = font("regular", 9);
  sub.textColor = t("muted");
  if (!categories.length) {
    widget.addSpacer(10);
    errorComp.renderNoData(widget, "No category spending yet");
    widget.addSpacer();
    footer(widget, { left: bucketName, right: "₹0" });
    return widget;
  }
  const visible = categories.slice(0, 4);
  widget.addSpacer(9);
  stackedCategoryBar(widget, categories);
  widget.addSpacer(10);
  for (let i = 0; i < visible.length; i++) {
    categoryBar(widget, visible[i], true);
    if (i < visible.length - 1) widget.addSpacer(5);
  }
  const remaining = categories.length - visible.length;
  if (remaining > 0) {
    widget.addSpacer(5);
    const more = widget.addText(`+${remaining} more`);
    more.font = font("regular", 8);
    more.textColor = t("muted");
  }
  widget.addSpacer();
  footer(widget, { left: `${categories.length} categories`, right: moneyShort(totalSpend) });
  return widget;
}
