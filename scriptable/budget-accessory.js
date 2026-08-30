// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: wallet;
// Track My Biryani — budget accessory (Lock Screen rectangular)
// Bucket-level budget: total spend of target, progress ball, day progress.

const endpoints = importModule("api/endpoints");
const bootstrap = importModule("lib/bootstrap");
const layout = importModule("lib/layout");
const components = importModule("lib/components");
const theme = importModule("lib/theme");
const date = importModule("lib/date");

const { budgetSummary } = components;
const { t } = theme;
const { font } = layout;
const { budgetPeriodProgress } = date;

const bucketId = String(args.widgetParameter || "").trim();

bootstrap.run(async () => {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();

  // ─────────────────────────────────────────
  // Only rectangular lock-screen is supported
  // ─────────────────────────────────────────

  if (layout.family() !== "accessoryRectangular") {
    const fallback = widget.addText("Track My Biryani");
    fallback.font = font("semibold", 12);
    fallback.textColor = t("text");
    return widget;
  }

  if (!bucketId) {
    const title = widget.addText("Set bucket ID");
    title.font = font("semibold", 10);
    title.textColor = t("muted");
    return widget;
  }

  const bucketsResponse = await endpoints.buckets();
  const buckets = Array.isArray(bucketsResponse?.items) ? bucketsResponse.items : [];
  const bucket = buckets.find((item) => item && item._id === bucketId);

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

  const budgetsResponse = await endpoints.budgets();
  const groups = Array.isArray(budgetsResponse) ? budgetsResponse : [];
  const allBudgets = groups.flatMap((g) => (Array.isArray(g.budgets) ? g.budgets : []));
  const bucketBudgets = allBudgets.filter(
    (b) => b && b.bucketId === bucketId && (b.categoryId === null || b.categoryId === undefined)
  );

  if (bucketBudgets.length === 0) {
    const title = widget.addText(bucket.name || "Budget");
    title.font = font("semibold", 10);
    title.textColor = t("text");
    widget.addSpacer(2);
    const msg = widget.addText("No bucket budget");
    msg.font = font("regular", 8);
    msg.textColor = t("muted");
    return widget;
  }

  let pick =
    bucketBudgets.find((b) => b.period === "monthly") ||
    bucketBudgets.find((b) => b.period === "yearly") ||
    bucketBudgets.find((b) => b.period === "weekly") ||
    bucketBudgets[0];

  const spent = Number(pick.spent) || 0;
  const target = Number(pick.amount) || 0;
  const pct = typeof pick.pct === "number" ? pick.pct : target > 0 ? (spent / target) * 100 : 0;
  const period = pick.period || "monthly";
  const { currentDay, totalDays } = budgetPeriodProgress(period);

  // ─────────────────────────────────────────
  // Header — icon + bucket name (compact)
  // ─────────────────────────────────────────

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

  // L1: spent of target (compact 140 width) — reused component in compactMode
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

  // no refresh footer on accessory — bootstrap skips it for non-rectangular,
  // but rectangular gets one automatically; keep layout tight so it fits

  return widget;
});
