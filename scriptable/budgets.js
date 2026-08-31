// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: wallet;
// Track My Biryani — Budgets Dashboard (All Sizes)
// Shows bucket hero + top categories; supports small/medium/large + accessories
// WidgetParameter: optional bucketId, defaults to me().bucketId
// Appropriate name: Budgets Overview

const widgets = importModule("api/widgets");
const bootstrap = importModule("lib/bootstrap");
const layout = importModule("lib/layout");
const theme = importModule("lib/theme");
const { renderSmall } = importModule("components/budgets/small");
const { renderMedium } = importModule("components/budgets/medium");
const { renderLarge } = importModule("components/budgets/large");
const { renderCircular } = importModule("components/budgets/circular");
const { renderRectangular } = importModule("components/budgets/rectangular");

const { t } = theme;
const { font } = layout;

bootstrap.run(async () => {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();

  // Accessory families hide refresh footer (tiny slots)
  if (layout.isAccessory()) widget.noRefreshFooter = true;

  const param = String(args.widgetParameter || "").trim();
  const { bucket, bucketId, bucketName, bucketBudgets, categoryBudgets } = await widgets.budgetsWidget({ bucketId: param });

  // Shared empty states for all sizes
  if (!bucketId) {
    const title = widget.addText("Track My Biryani");
    title.font = font("semibold", 14);
    title.textColor = t("text");
    title.centerAlignText();
    widget.addSpacer(5);
    const msg = widget.addText("Set a bucket ID in Widget Parameter");
    msg.font = font("regular", 10);
    msg.textColor = t("muted");
    msg.centerAlignText();
    return widget;
  }
  if (!bucket) {
    const title = widget.addText("Bucket Not Found");
    title.font = font("semibold", 14);
    title.textColor = t("text");
    title.centerAlignText();
    widget.addSpacer(5);
    const msg = widget.addText(bucketId);
    msg.font = font("regular", 9);
    msg.textColor = t("muted");
    msg.centerAlignText();
    msg.lineLimit = 2;
    return widget;
  }
  if (bucketBudgets.length === 0 && categoryBudgets.length === 0) {
    const title = widget.addText(bucketName);
    title.font = font("semibold", 14);
    title.textColor = t("text");
    title.centerAlignText();
    widget.addSpacer(5);
    const msg = widget.addText("No budgets — create one in the app");
    msg.font = font("regular", 10);
    msg.textColor = t("muted");
    msg.centerAlignText();
    return widget;
  }

  // Layout via helpers — no plain string comparisons
  if (layout.isSmall()) return renderSmall(widget, { bucket, bucketBudgets, categoryBudgets });
  if (layout.isMedium()) return renderMedium(widget, { bucket, bucketName, bucketBudgets, categoryBudgets });
  if (layout.isLarge()) return renderLarge(widget, { bucket, bucketName, bucketBudgets, categoryBudgets });
  if (layout.isCircular() || layout.isInline()) return renderCircular(widget, { bucket, bucketBudgets, categoryBudgets });
  if (layout.isRectangular()) return renderRectangular(widget, { bucket, bucketName, bucketBudgets, categoryBudgets });
  return renderMedium(widget, { bucket, bucketName, bucketBudgets, categoryBudgets });
});
