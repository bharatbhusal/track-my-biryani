// ─────────────────────────────────────────────────────────────────────────────
// components/category-month/circular.js
// Circular accessory: tiny, just top category emoji + pct, centered
// ─────────────────────────────────────────────────────────────────────────────
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");

const { t } = theme;
const { font } = layout;

module.exports = { renderCircular };

function renderCircular(widget, { categories }) {
  widget.addSpacer();
  if (!categories.length) {
    const e = widget.addText("—");
    e.font = font("regular", 12);
    e.textColor = t("muted");
    e.centerAlignText();
    widget.addSpacer();
    return widget;
  }
  const top = categories[0];
  const emoji = widget.addText(top.emoji);
  emoji.font = font("regular", 16);
  emoji.centerAlignText();
  widget.addSpacer(2);
  const pct = widget.addText(`${top.pct}%`);
  pct.font = font("bold", 13);
  pct.textColor = t("text");
  pct.centerAlignText();
  widget.addSpacer();
  return widget;
}
