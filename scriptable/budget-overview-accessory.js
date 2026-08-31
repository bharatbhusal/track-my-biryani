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
const date = importModule("lib/date");
const { budgetOverviewSummary } = importModule("components/budget-overview-accessory/rectangular");
const { renderSmall } = importModule("components/budget-overview-accessory/small");
const { renderMedium } = importModule("components/budget-overview-accessory/medium");
const { renderLarge } = importModule("components/budget-overview-accessory/large");
const { renderCircular } = importModule("components/budget-overview-accessory/circular");

const { t } = theme;
const { font } = layout;
const { budgetPeriodProgress } = date;

bootstrap.run(async () => {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();
  if (layout.isAccessory()) widget.noRefreshFooter = true;

  const param = String(args.widgetParameter || "").trim();
  const { bucket, budget: pick, bucketId, perDay } = await widgets.budgetOverviewAccessory({ bucketId: param });

  if (!bucketId) {
    const title = widget.addText("Set bucket ID");
    title.font = font("semibold", 12);
    title.textColor = t("muted");
    title.centerAlignText();
    return widget;
  }
  if (!bucket) {
    const title = widget.addText("Bucket not found");
    title.font = font("semibold", 12);
    title.textColor = t("muted");
    title.centerAlignText();
    widget.addSpacer(2);
    const id = widget.addText(bucketId);
    id.font = font("regular", 8);
    id.textColor = t("muted");
    id.centerAlignText();
    id.lineLimit = 1;
    return widget;
  }
  if (!pick) {
    const title = widget.addText(bucket.name || "Budget");
    title.font = font("semibold", 12);
    title.textColor = t("text");
    title.centerAlignText();
    widget.addSpacer(4);
    const msg = widget.addText("No bucket budget");
    msg.font = font("regular", 10);
    msg.textColor = t("muted");
    msg.centerAlignText();
    return widget;
  }

  // Switch on family for size-appropriate layout
  const family = layout.family();
  switch (family) {
    case "small":
      return renderSmall(widget, { bucket, budget: pick, perDay });
    case "medium":
      return renderMedium(widget, { bucket, budget: pick, perDay });
    case "large":
    case "extraLarge":
      return renderLarge(widget, { bucket, budget: pick, perDay });
    case "accessoryCircular":
    case "accessoryInline":
      return renderCircular(widget, { bucket, budget: pick, perDay });
    case "accessoryRectangular":
    default: {
      // Rectangular: header + combined summary (Day X/Y left, perDay right)
      const spent = pick.spent;
      const target = pick.amount;
      const pct = target > 0 ? (spent / target) * 100 : pick.pct;
      const period = pick.period || "monthly";
      const { currentDay, totalDays } = budgetPeriodProgress(period);
      const header = widget.addStack();
      header.layoutHorizontally();
      header.centerAlignContent();
      const icon = header.addText(bucket.icon || "💰");
      icon.font = font("regular", 10);
      header.addSpacer(4);
      const title = header.addText(bucket.name || "Budget");
      title.font = font("semibold", 9);
      title.textColor = t("text");
      title.lineLimit = 1;
      header.addSpacer();
      const pill = header.addText(String(period).slice(0, 3));
      pill.font = font("regular", 7);
      pill.textColor = t("muted");
      widget.addSpacer(4);
      budgetOverviewSummary(widget, {
        spent,
        target,
        pct,
        currentDay,
        totalDays,
        perDay,
        width: 145,
        compactMode: true,
      });
      return widget;
    }
  }
});
