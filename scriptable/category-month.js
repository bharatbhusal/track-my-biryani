// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: magic;
// Track My Biryani — Category Spending Breakdown (All Sizes)
// Monthly distribution by category; supports small/medium/large/circular/rectangular
// WidgetParameter: optional bucketId, defaults to me().bucketId
// Appropriate name: Monthly Category Breakdown

const widgets = importModule("api/widgets");
const bootstrap = importModule("lib/bootstrap");
const layout = importModule("lib/layout");
const theme = importModule("lib/theme");
const { renderSmall } = importModule("components/category-month/small");
const { renderMedium } = importModule("components/category-month/medium");
const { renderLarge } = importModule("components/category-month/large");
const { renderCircular } = importModule("components/category-month/circular");
const { renderRectangular } = importModule("components/category-month/rectangular");

const { t } = theme;
const { font } = layout;

bootstrap.run(async () => {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();
  if (layout.isAccessory()) widget.noRefreshFooter = true;

  const param = String(args.widgetParameter || "").trim();
  const { bucket, bucketId, bucketName, categories, totalSpend } = await widgets.categoryMonth({
    bucketId: param,
  });

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

  // Layout via layout helpers — no plain strings
  if (layout.isSmall()) return renderSmall(widget, { categories });
  if (layout.isMedium()) return renderMedium(widget, { bucketName, categories, totalSpend });
  if (layout.isLarge()) return renderLarge(widget, { bucketName, categories, totalSpend });
  if (layout.isCircular() || layout.isInline()) return renderCircular(widget, { categories });
  if (layout.isRectangular()) return renderRectangular(widget, { categories });
  return renderMedium(widget, { bucketName, categories, totalSpend });
});
