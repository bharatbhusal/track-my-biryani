// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: magic;
// Track My Biryani — monthly overview
// Current month spend + daily average + latest expenses.

const widgets = importModule("api/widgets");
const bootstrap = importModule("lib/bootstrap");
const layout = importModule("lib/layout");
const components = importModule("lib/components");
const theme = importModule("lib/theme");
const moneyLib = importModule("lib/money");
const date = importModule("lib/date");

const { footer, expenseBar } = components;
const { t } = theme;
const { font } = layout;
const { moneyShort, compact } = moneyLib;
const { currentMonthProgress } = date;

function bar(parent, { value, color, trackColor }) {
  const row = parent.addStack();
  row.layoutHorizontally();
  const total = 320;
  const progress = Math.max(0, Math.min(1, value));
  const fill = Math.round(total * progress);
  const filled = row.addStack();
  filled.size = new Size(fill, 6);
  filled.cornerRadius = 3;
  filled.backgroundColor = color || t("accent");
  const track = row.addStack();
  track.size = new Size(total - fill, 6);
  track.cornerRadius = 3;
  track.backgroundColor = trackColor || t("border");
  return row;
}

bootstrap.run(async () => {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();

  const param = String(args.widgetParameter || "").trim();
  const { bucket, bucketId, bucketName, expenses, total, totalSpend } = await widgets.monthOverview(
    {
      bucketId: param,
    },
  );

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

  const month = currentMonthProgress();
  const perDay = month.currentDay > 0 ? totalSpend / month.currentDay : 0;

  const header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();
  const title = header.addText(`This Month · ${bucketName}`);
  title.font = font("semibold", 15);
  title.textColor = t("text");
  title.lineLimit = 1;
  header.addSpacer();
  const day = header.addText(`Day ${month.currentDay}/${month.daysInMonth}`);
  day.font = font("regular", 10);
  day.textColor = t("muted");
  day.rightAlignText();
  widget.addSpacer(8);

  const stats = widget.addStack();
  stats.layoutHorizontally();
  const totalStack = stats.addStack();
  totalStack.layoutVertically();
  const totalLabel = totalStack.addText("Total Spent");
  totalLabel.font = font("regular", 9);
  totalLabel.textColor = t("muted");
  const totalValue = totalStack.addText(compact(totalSpend));
  totalValue.font = font("semibold", 15);
  totalValue.textColor = t("primary");
  stats.addSpacer();
  const perDayStack = stats.addStack();
  perDayStack.layoutVertically();
  const perDayLabel = perDayStack.addText("Per Day");
  perDayLabel.font = font("regular", 9);
  perDayLabel.textColor = t("muted");
  perDayLabel.rightAlignText();
  const perDayValue = perDayStack.addText(moneyShort(perDay));
  perDayValue.font = font("semibold", 15);
  perDayValue.textColor = t("text");
  perDayValue.rightAlignText();
  widget.addSpacer(7);

  bar(widget, { value: month.progress, color: t("accent") });
  widget.addSpacer(10);

  const section = widget.addText("Latest Expenses");
  section.font = font("semibold", 11);
  section.textColor = t("text");
  widget.addSpacer(6);

  if (expenses.length === 0) {
    const empty = widget.addText("No expenses this month");
    empty.font = font("regular", 10);
    empty.textColor = t("muted");
  } else {
    const latest = expenses.slice(0, 6);
    for (let i = 0; i < latest.length; i++) {
      expenseBar(widget, latest[i]);
      if (i < latest.length - 1) widget.addSpacer(7);
    }
  }

  widget.addSpacer();
  footer(widget, { left: `${total ?? expenses.length} expenses`, right: moneyShort(totalSpend) });
  return widget;
});
