// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: magic;
// Track My Biryani — Monthly Spend Summary (All Sizes)
// Shows total spend + per-day avg; accessory is compact rectangular
// WidgetParameter: optional bucketId, defaults to me().bucketId
// Appropriate name: Monthly Spend Summary

const widgets = importModule("api/widgets");
const bootstrap = importModule("lib/bootstrap");
const layout = importModule("lib/layout");
const theme = importModule("lib/theme");
const { renderSmall } = importModule("components/overview-accessory/small");
const { renderMedium } = importModule("components/overview-accessory/medium");
const { renderLarge } = importModule("components/overview-accessory/large");
const { renderCircular } = importModule("components/overview-accessory/circular");
const { renderRectangular } = importModule("components/overview-accessory/rectangular");

const { t } = theme;
const { font } = layout;

bootstrap.run(async () => {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();
  if (layout.isAccessory()) widget.noRefreshFooter = true;

  const param = String(args.widgetParameter || "").trim();
  const { totalSpend, perDay, expenseCount } = await widgets.overviewAccessory({ bucketId: param });
  // expenseCount is 0 if not returned; overview currently returns perDay + totalSpend
  // We enrich with expenseCount if available via overview raw (not needed for accessory)

  if (layout.isSmall()) return renderSmall(widget, { totalSpend });
  if (layout.isMedium()) return renderMedium(widget, { totalSpend, perDay });
  if (layout.isLarge()) return renderLarge(widget, { totalSpend, perDay, expenseCount });
  if (layout.isCircular() || layout.isInline()) return renderCircular(widget, { totalSpend });
  // accessoryRectangular is default — lives in components/overview-accessory/rectangular.js
  return renderRectangular(widget, { totalSpend, perDay });
});
