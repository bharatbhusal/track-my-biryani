// ─────────────────────────────────────────────────────────────────────────────
// components/category-month/large.js
// Large (4x2): header + stacked bar + 10 category rows + footer
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");
const shared = importModule("components/shared");
const catComp = importModule("components/category-month/rectangular");

const { t } = theme;
const { font } = layout;
const { moneyShort } = moneyLib;
const { footer } = shared;
const { categoryBar, stackedCategoryBar } = catComp;

module.exports = { renderLarge };

function renderLarge(widget, { bucketName, categories, totalSpend }) {
  const header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();
  const title = header.addText(`Where It Went · ${bucketName}`);
  title.font = font("semibold", 15);
  title.textColor = t("text");
  title.lineLimit = 1;
  header.addSpacer();
  const sub = header.addText("This Month");
  sub.font = font("regular", 9);
  sub.textColor = t("muted");
  if (!categories.length) {
    widget.addSpacer(10);
    const empty = widget.addText("No category spending yet");
    empty.font = font("regular", 10);
    empty.textColor = t("muted");
    widget.addSpacer();
    footer(widget, { left: bucketName, right: "₹0" });
    return widget;
  }
  const visible = categories.slice(0, 10);
  widget.addSpacer(9);
  stackedCategoryBar(widget, categories);
  widget.addSpacer(10);
  for (let i = 0; i < visible.length; i++) {
    categoryBar(widget, visible[i], true);
    if (i < visible.length - 1) widget.addSpacer(6);
  }
  const remaining = categories.length - visible.length;
  if (remaining > 0) {
    widget.addSpacer(5);
    const more = widget.addText(`+${remaining} more categories`);
    more.font = font("regular", 8);
    more.textColor = t("muted");
  }
  widget.addSpacer();
  footer(widget, { left: `${categories.length} categories`, right: moneyShort(totalSpend) });
  return widget;
}
