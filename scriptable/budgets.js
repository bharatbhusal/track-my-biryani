// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: wallet;
// Track My Biryani — budget large
// Shows all budgets for a bucket: bucket budget first, then top 3 category budgets by pct.
// No Day X line. Bar ball is hidden when over 100% (inspired by budget-card.tsx).

const endpoints = importModule("api/endpoints");
const bootstrap = importModule("lib/bootstrap");
const layout = importModule("lib/layout");
const components = importModule("lib/components");
const theme = importModule("lib/theme");

const { budgetCard, budgetHeroCard } = components;
const { t } = theme;
const { font } = layout;

const bucketId = String(args.widgetParameter || "").trim();

bootstrap.run(async () => {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();

  const family = layout.family();
  const isLarge = family === "large" || family === "extraLarge";
  const isMedium = family === "medium";
  const isAccessory = layout.isAccessory();

  if (isAccessory) {
    const title = widget.addText("Budget · Large");
    title.font = font("semibold", 12);
    title.textColor = t("text");
    widget.addSpacer(4);
    const hint = widget.addText("Use budget-accessory for Lock Screen");
    hint.font = font("regular", 9);
    hint.textColor = t("muted");
    return widget;
  }

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

  const bucketsResponse = await endpoints.buckets();
  const buckets = Array.isArray(bucketsResponse?.items) ? bucketsResponse.items : [];
  const bucket = buckets.find((item) => item && item._id === bucketId);

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

  const bucketName = bucket.name || "Bucket";

  const budgetsResponse = await endpoints.budgets();
  const groups = Array.isArray(budgetsResponse) ? budgetsResponse : [];
  const allBudgets = groups.flatMap((g) => (Array.isArray(g.budgets) ? g.budgets : []));
  const inBucket = allBudgets.filter((b) => b && b.bucketId === bucketId);

  if (inBucket.length === 0) {
    const title = widget.addText(bucketName);
    title.font = font("semibold", 14);
    title.textColor = t("text");
    widget.addSpacer(5);
    const message = widget.addText("No budgets — create one in the app");
    message.font = font("regular", 10);
    message.textColor = t("muted");
    return widget;
  }

  const bucketBudgets = inBucket.filter((b) => b.categoryId === null || b.categoryId === undefined);
  const categoryBudgets = inBucket
    .filter((b) => b.categoryId !== null && b.categoryId !== undefined)
    .sort((a, b) => (Number(b.pct) || 0) - (Number(a.pct) || 0))
    .slice(0, 3);

  const width = isLarge ? 300 : isMedium ? 260 : 300;
  const compactMode = !isLarge;

  // ─────────────────────────────────────────
  // Bucket budgets (usually 1) — first
  // ─────────────────────────────────────────

  // bucket-level hero — distinct design at top
  if (bucketBudgets.length > 0) {
    for (let i = 0; i < bucketBudgets.length; i++) {
      const b = bucketBudgets[i];
      budgetHeroCard(widget, {
        title: bucketName,
        emoji: bucket.icon || "💰",
        period: b.period,
        spent: Number(b.spent) || 0,
        target: Number(b.amount) || 0,
        pct: Number(b.pct) || 0,
        width,
        compactMode,
      });
      if (i < bucketBudgets.length - 1 || categoryBudgets.length > 0)
        widget.addSpacer(isLarge ? 10 : 8);
    }
  }

  // ─────────────────────────────────────────
  // Top 3 category budgets by pct
  // ─────────────────────────────────────────

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
        emoji: b.categoryEmoji || "🏷️",
        indicatorColor: b.categoryColor || "#999999",
        period: b.period,
        spent: Number(b.spent) || 0,
        target: Number(b.amount) || 0,
        pct: Number(b.pct) || 0,
        width,
        compactMode,
      });
      if (i < categoryBudgets.length - 1) widget.addSpacer(isLarge ? 6 : 5);
    }
  }

  widget.addSpacer();

  return widget;
});
