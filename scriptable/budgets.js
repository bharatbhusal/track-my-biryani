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
const errorComp = importModule("components/error");

bootstrap.run(async () => {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();

  // Accessory families hide refresh footer (tiny slots)
  if (layout.isAccessory()) widget.noRefreshFooter = true;

  const param = String(args.widgetParameter || "").trim();
  const { bucket, bucketId, bucketName, bucketBudgets, categoryBudgets } =
    await widgets.budgetsWidget({ bucketId: param });

  // Empty states via error component (custom messages, no duplicates)
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
  if (bucketBudgets.length === 0 && categoryBudgets.length === 0)
    return errorComp.addInlineError(widget, {
      title: bucketName || "Budgets",
      message: "No budgets — create one in the app",
      titleSize: 14,
      messageSize: 10,
      titleColor: "text",
    });

  // Layout via helpers — no plain string comparisons
  if (layout.isSmall()) return renderSmall(widget, { bucket, bucketBudgets, categoryBudgets });
  if (layout.isMedium())
    return renderMedium(widget, { bucket, bucketName, bucketBudgets, categoryBudgets });
  if (layout.isLarge())
    return renderLarge(widget, { bucket, bucketName, bucketBudgets, categoryBudgets });
  if (layout.isCircular() || layout.isInline())
    return renderCircular(widget, { bucket, bucketBudgets, categoryBudgets });
  if (layout.isRectangular()) return renderRectangular(widget, { bucketBudgets, categoryBudgets });
  return renderLarge(widget, { bucket, bucketName, bucketBudgets, categoryBudgets });
});
