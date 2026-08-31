// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: magic;
// Track My Biryani — Monthly Spend Overview (All Sizes)
// Current month spend + per-day avg + latest expenses
// WidgetParameter: optional bucketId, defaults to me().bucketId
// Appropriate name: Monthly Expense Overview

const widgets = importModule("api/widgets");
const bootstrap = importModule("lib/bootstrap");
const layout = importModule("lib/layout");
const theme = importModule("lib/theme");
const date = importModule("lib/date");
const { renderSmall } = importModule("components/month-overview/small");
const { renderMedium } = importModule("components/month-overview/medium");
const { renderLarge } = importModule("components/month-overview/large");
const { renderCircular } = importModule("components/month-overview/circular");
const { renderRectangular } = importModule("components/month-overview/rectangular");

const { t } = theme;
const { font } = layout;
const { currentMonthProgress } = date;

bootstrap.run(async () => {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();
  if (layout.isAccessory()) widget.noRefreshFooter = true;

  const param = String(args.widgetParameter || "").trim();
  const { bucket, bucketId, bucketName, expenses, total, totalSpend } = await widgets.monthOverview(
    { bucketId: param },
  );

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

  // Local date progress for perDay calc (not API)
  const month = currentMonthProgress();

  // Layout via helpers — no string literals
  if (layout.isSmall()) return renderSmall(widget, { bucketName, expenses, total, totalSpend, month });
  if (layout.isMedium()) return renderMedium(widget, { bucketName, expenses, total, totalSpend, month });
  if (layout.isLarge()) return renderLarge(widget, { bucketName, expenses, total, totalSpend, month });
  if (layout.isCircular() || layout.isInline()) return renderCircular(widget, { bucket, totalSpend });
  if (layout.isRectangular()) return renderRectangular(widget, { bucket, bucketName, expenses, total, totalSpend, month });
  return renderMedium(widget, { bucketName, expenses, total, totalSpend, month });
});
