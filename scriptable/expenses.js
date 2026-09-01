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
const { renderSmall } = importModule("components/expenses/small");
const { renderMedium } = importModule("components/expenses/medium");
const { renderLarge } = importModule("components/expenses/large");
const { renderCircular } = importModule("components/expenses/circular");
const { renderRectangular } = importModule("components/expenses/rectangular");
const errorComp = importModule("components/error");

const { currentMonthProgress } = date;

bootstrap.run(async () => {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();
  if (layout.isAccessory()) widget.noRefreshFooter = true;

  const param = String(args.widgetParameter || "").trim();
  const { bucket, bucketId, bucketName, expenses, total, totalSpend } = await widgets.monthOverview(
    { bucketId: param },
  );

  if (!bucketId)
    return errorComp.addInlineError(widget, {
      title: "Track My Biryani",
      message: "Set a bucket ID in Widget Parameter",
      titleSize: 14,
      messageSize: 10,
      titleColor: "text",
    });
  if (!bucket)
    return errorComp.addInlineError(widget, {
      title: "Bucket Not Found",
      message: String(bucketId || ""),
      titleSize: 14,
      messageSize: 9,
      titleColor: "text",
    });

  // Local date progress for perDay calc (not API)
  const month = currentMonthProgress();

  // Layout via helpers — no string literals
  if (layout.isSmall())
    return renderSmall(widget, { bucketName, expenses, total, totalSpend, month });
  if (layout.isMedium())
    return renderMedium(widget, { bucketName, expenses, total, totalSpend, month });
  if (layout.isLarge())
    return renderLarge(widget, { bucketName, expenses, total, totalSpend, month });
  if (layout.isCircular() || layout.isInline())
    return renderCircular(widget, { bucket, totalSpend });
  if (layout.isRectangular())
    return renderRectangular(widget, { bucket, bucketName, expenses, total, totalSpend, month });
  return renderMedium(widget, { bucketName, expenses, total, totalSpend, month });
});
