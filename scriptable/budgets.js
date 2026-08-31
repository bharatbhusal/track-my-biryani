// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: wallet;
// Track My Biryani — budget large
// Shows all budgets for a bucket: bucket budget first, then top 3 category budgets by pct.

const widgets = importModule("api/widgets");
const bootstrap = importModule("lib/bootstrap");
const layout = importModule("lib/layout");
const components = importModule("lib/components");
const theme = importModule("lib/theme");

const { budgetCard, budgetHeroCard } = components;
const { t } = theme;
const { font } = layout;

bootstrap.run(async () => {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();

  const family = layout.family();
  const isLarge = family === "large" || family === "extraLarge";
  const isMedium = family === "medium";
  const isAccessory = layout.isAccessory();

  if (isAccessory) {
    widget.noRefreshFooter = true;
    const title = widget.addText("Budget · Large");
    title.font = font("semibold", 12);
    title.textColor = t("text");
    widget.addSpacer(4);
    const hint = widget.addText("Use budget-accessory for Lock Screen");
    hint.font = font("regular", 9);
    hint.textColor = t("muted");
    return widget;
  }

  const param = String(args.widgetParameter || "").trim();
  const { bucket, bucketId, bucketName, bucketBudgets, categoryBudgets } =
    await widgets.budgetsWidget({
      bucketId: param,
    });

  if (!bucketId) {
    const title = widget.addText("Track My Biryani");
    title.font = font("semibold", 14);
    title.textColor = t("text");
    widget.addSpacer(5);
    const message = widget.addText("Set a bucket ID in Widget Parameter");
    message.font = font("regular", 10);
    message.textColor = t("muted");
    return widget;
  }

  if (!bucket) {
    const title = widget.addText("Bucket Not Found");
    title.font = font("semibold", 14);
    title.textColor = t("text");
    widget.addSpacer(5);
    const message = widget.addText(bucketId);
    message.font = font("regular", 9);
    message.textColor = t("muted");
    message.lineLimit = 2;
    return widget;
  }

  if (bucketBudgets.length === 0 && categoryBudgets.length === 0) {
    const title = widget.addText(bucketName);
    title.font = font("semibold", 14);
    title.textColor = t("text");
    widget.addSpacer(5);
    const message = widget.addText("No budgets — create one in the app");
    message.font = font("regular", 10);
    message.textColor = t("muted");
    return widget;
  }

  const width = isLarge ? 320 : isMedium ? 260 : 320;
  const compactMode = !isLarge;

  if (bucketBudgets.length > 0) {
    for (let i = 0; i < bucketBudgets.length; i++) {
      const b = bucketBudgets[i];
      budgetHeroCard(widget, {
        title: bucketName,
        emoji: bucket.icon || "💰",
        period: b.period,
        spent: b.spent,
        target: b.amount,
        pct: b.pct,
        width,
        compactMode,
      });
      if (i < bucketBudgets.length - 1 || categoryBudgets.length > 0)
        widget.addSpacer(isLarge ? 10 : 8);
    }
  }

  if (categoryBudgets.length > 0) {
    if (bucketBudgets.length > 0) {
      const sep = widget.addText("Top category budgets");
      sep.font = font("semibold", 10);
      sep.textColor = t("muted");
      widget.addSpacer(5);
    }
    for (let i = 0; i < categoryBudgets.length; i++) {
      const b = categoryBudgets[i];
      budgetCard(widget, {
        title: b.categoryName || "Category",
        emoji: b.categoryEmoji,
        indicatorColor: b.categoryColor,
        period: b.period,
        spent: b.spent,
        target: b.amount,
        pct: b.pct,
        width,
        compactMode,
      });
      if (i < categoryBudgets.length - 1) widget.addSpacer(isLarge ? 6 : 5);
    }
  }

  widget.addSpacer();

  return widget;
});
