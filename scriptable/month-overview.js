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
const { renderSmall } = importModule("components/month-overview/small");
const { renderMedium } = importModule("components/month-overview/medium");
const { renderLarge } = importModule("components/month-overview/large");
const { renderCircular } = importModule("components/month-overview/circular");

const { t } = theme;
const { font } = layout;
const { currentMonthProgress } = date;

bootstrap.run(async () => {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();
  if (layout.isAccessory()) widget.noRefreshFooter = true;

  const param = String(args.widgetParameter || "").trim();
  const { bucket, bucketId, bucketName, expenses, total, totalSpend } = await widgets.monthOverview({ bucketId: param });

  if (!bucketId) {
    const title = widget.addText("Track My Biryani");
    title.font = font("semibold", 14);
    title.textColor = t("text");
    title.centerAlignText();
    widget.addSpacer(5);
    const msg = widget.addText("Set a bucket ID in Widget Parameter");
    msg.font = font("regular", 10);
    msg.textColor = t("muted");
    msg.centerAlignText();
    return widget;
  }
  if (!bucket) {
    const title = widget.addText("Bucket Not Found");
    title.font = font("semibold", 14);
    title.textColor = t("text");
    title.centerAlignText();
    widget.addSpacer(5);
    const msg = widget.addText(bucketId);
    msg.font = font("regular", 9);
    msg.textColor = t("muted");
    msg.centerAlignText();
    msg.lineLimit = 2;
    return widget;
  }

  // Local date progress for perDay calc (not API)
  const month = currentMonthProgress();

  const family = layout.family();
  switch (family) {
    case "small":
      return renderSmall(widget, { bucketName, expenses, total, totalSpend, month });
    case "medium":
      return renderMedium(widget, { bucketName, expenses, total, totalSpend, month });
    case "large":
    case "extraLarge":
      return renderLarge(widget, { bucketName, expenses, total, totalSpend, month });
    case "accessoryCircular":
    case "accessoryInline":
      return renderCircular(widget, { bucket, totalSpend });
    case "accessoryRectangular": {
      // Rectangular: compact total + perDay + 2 latest, no refresh
      const { expenseBar } = importModule("components/month-overview/rectangular");
      const { footer } = importModule("components/shared");
      const { compact, moneyShort } = importModule("lib/money");
      const perDay = month.currentDay > 0 ? totalSpend / month.currentDay : 0;
      const header = widget.addStack();
      header.layoutHorizontally();
      const icon = header.addText("📅");
      icon.font = font("regular", 10);
      header.addSpacer(4);
      const title = header.addText(bucketName);
      title.font = font("semibold", 9);
      title.textColor = t("text");
      header.addSpacer();
      const day = header.addText(`${compact(totalSpend)}`);
      day.font = font("semibold", 10);
      day.textColor = t("primary");
      widget.addSpacer(4);
      if (expenses.length) {
        const top = expenses.slice(0, 2);
        for (let i = 0; i < top.length; i++) {
          expenseBar(widget, top[i]);
          if (i < top.length - 1) widget.addSpacer(4);
        }
      } else {
        const e = widget.addText("No expenses");
        e.font = font("regular", 9);
        e.textColor = t("muted");
        e.centerAlignText();
      }
      widget.addSpacer();
      footer(widget, { left: `Day ${month.currentDay}/${month.daysInMonth}`, right: `${moneyShort(perDay)}/day` });
      return widget;
    }
    default:
      return renderMedium(widget, { bucketName, expenses, total, totalSpend, month });
  }
});
