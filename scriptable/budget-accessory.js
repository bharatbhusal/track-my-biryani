// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: wallet;
// Track My Biryani — budget accessory (Lock Screen rectangular)
// Bucket-level budget: total spend of target, progress ball, day progress.

const widgets = importModule("api/widgets");
const bootstrap = importModule("lib/bootstrap");
const layout = importModule("lib/layout");
const components = importModule("lib/components");
const theme = importModule("lib/theme");
const date = importModule("lib/date");

const { budgetSummary } = components;
const { t } = theme;
const { font } = layout;
const { budgetPeriodProgress } = date;

bootstrap.run(async () => {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();
  widget.noRefreshFooter = true;

  if (layout.family() !== "accessoryRectangular") {
    const fallback = widget.addText("Track My Biryani");
    fallback.font = font("semibold", 12);
    fallback.textColor = t("text");
    return widget;
  }

  const param = String(args.widgetParameter || "").trim();
  const { bucket, budget: pick, bucketId } = await widgets.budgetAccessory({ bucketId: param });

  if (!bucketId) {
    const title = widget.addText("Set bucket ID");
    title.font = font("semibold", 10);
    title.textColor = t("muted");
    return widget;
  }

  if (!bucket) {
    const title = widget.addText("Bucket not found");
    title.font = font("semibold", 10);
    title.textColor = t("muted");
    widget.addSpacer(2);
    const id = widget.addText(bucketId);
    id.font = font("regular", 7);
    id.textColor = t("muted");
    id.lineLimit = 1;
    return widget;
  }

  if (!pick) {
    const title = widget.addText(bucket.name || "Budget");
    title.font = font("semibold", 10);
    title.textColor = t("text");
    widget.addSpacer(2);
    const msg = widget.addText("No bucket budget");
    msg.font = font("regular", 8);
    msg.textColor = t("muted");
    return widget;
  }

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

  budgetSummary(widget, {
    spent,
    target,
    pct,
    currentDay,
    totalDays,
    period: null,
    width: 145,
    compactMode: true,
  });

  return widget;
});
