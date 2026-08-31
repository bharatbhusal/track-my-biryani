// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: magic;
// Track My Biryani — Lock Screen rectangular
// Monthly total spend + daily spending average.

const endpoints = importModule("api/endpoints");
const bootstrap = importModule("lib/bootstrap");
const layout = importModule("lib/layout");
const theme = importModule("lib/theme");
const moneyLib = importModule("lib/money");
const date = importModule("lib/date");

const { t } = theme;
const { font } = layout;
const { compact, moneyShort } = moneyLib;
const { currentMonthRange } = date;

bootstrap.run(async () => {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();

  let bucketId = String(args.widgetParameter || "").trim();
  if (!bucketId) {
    try {
      const me = await endpoints.authMe();
      bucketId = me?.bucketId || "";
    } catch {}
  }

  // ─────────────────────────────────────────────
  // Date range
  // ─────────────────────────────────────────────

  const { from, to } = currentMonthRange();

  // ─────────────────────────────────────────────
  // Fetch monthly overview
  // ─────────────────────────────────────────────

  const response = await endpoints.overview({
    from,
    to,
    bucketId: bucketId || undefined,
  });

  // API:
  //
  // {
  //   success: true,
  //   data: [
  //     {
  //       key: "total_spend",
  //       title: "Total Spend",
  //       value: 7891.9
  //     },
  //     {
  //       key: "spend_per_day",
  //       title: "Per Day Spend",
  //       value: 717.4454
  //     }
  //   ]
  // }

  const rows = response;

  const stats = {};

  for (const row of rows) {
    stats[row.key] = Number(row.value) || 0;
  }

  const totalSpend = stats.total_spend || 0;
  const perDay = stats.spend_per_day || 0;

  // ─────────────────────────────────────────────
  // Lock Screen rectangular
  // ─────────────────────────────────────────────

  if (layout.family() !== "accessoryRectangular") {
    const fallback = widget.addText("Track My Biryani");
    fallback.font = font("semibold", 12);
    fallback.textColor = t("text");

    return widget;
  }

  // ─────────────────────────────────────────────
  // Header
  // ─────────────────────────────────────────────

  const header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();

  const icon = header.addText("🥘");
  icon.font = font("regular", 12);

  header.addSpacer(5);

  const title = header.addText("THIS MONTH");
  title.font = font("semibold", 9);
  title.textColor = t("text");

  // ─────────────────────────────────────────────
  // Total spend
  // ─────────────────────────────────────────────

  widget.addSpacer(2);

  const spendRow = widget.addStack();
  spendRow.layoutHorizontally();
  spendRow.centerAlignContent();

  const spend = spendRow.addText(compact(totalSpend));
  spend.font = font("semibold", 17);
  spend.textColor = t("primary");

  spendRow.addSpacer(5);

  const spentLabel = spendRow.addText("spent");
  spentLabel.font = font("regular", 9);
  spentLabel.textColor = t("muted");

  // ─────────────────────────────────────────────
  // Per day
  // ─────────────────────────────────────────────

  const dayRow = widget.addStack();
  dayRow.layoutHorizontally();
  dayRow.centerAlignContent();

  const perDayValue = dayRow.addText(compact(perDay));
  perDayValue.font = font("semibold", 10);
  perDayValue.textColor = t("text");

  dayRow.addSpacer(4);

  const perDayLabel = dayRow.addText("/ day");
  perDayLabel.font = font("regular", 9);
  perDayLabel.textColor = t("muted");

  return widget;
});
