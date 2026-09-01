// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: wallet;
// Track My Biryani — Budget + Daily Spend (All Sizes)
// Combines budget progress with per-day spend ("590/day" on Day line)
// WidgetParameter: optional bucketId, defaults to me().bucketId
// Appropriate name: Budget & Daily Spend Tracker

const widgets = importModule("api/widgets");
const bootstrap = importModule("lib/bootstrap");
const layout = importModule("lib/layout");
const theme = importModule("lib/theme");
const { renderRectangular } = importModule("components/overview/rectangular");
const { renderSmall } = importModule("components/overview/small");
const { renderMedium } = importModule("components/overview/medium");
const { renderLarge } = importModule("components/overview/large");
const { renderCircular } = importModule("components/overview/circular");
const errorComp = importModule("components/error");

bootstrap.run(async () => {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();
  if (layout.isAccessory()) widget.noRefreshFooter = true;

  const param = String(args.widgetParameter || "").trim();
  const {
    bucket,
    budget: pick,
    bucketId,
    perDay,
  } = await widgets.budgetOverviewAccessory({ bucketId: param });

  if (!bucketId) return errorComp.renderNoBucketId(widget);
  if (!bucket) return errorComp.renderBucketNotFound(widget, bucketId);
  if (!pick) return errorComp.renderNoBudget(widget, bucket.name);

  // Layout via layout helpers (no plain strings)
  if (layout.isSmall()) return renderSmall(widget, { bucket, budget: pick, perDay });
  if (layout.isMedium()) return renderMedium(widget, { bucket, budget: pick, perDay });
  if (layout.isLarge()) return renderLarge(widget, { bucket, budget: pick, perDay });
  if (layout.isCircular() || layout.isInline())
    return renderCircular(widget, { bucket, budget: pick, perDay });
  return renderRectangular(widget, { bucket, budget: pick, perDay });
});
