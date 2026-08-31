// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: magic;
// Track My Biryani — Monthly Spend Summary (All Sizes)
// Shows total spend + per-day avg; accessory is compact rectangular
// WidgetParameter: optional bucketId, defaults to me().bucketId
// Appropriate name: Monthly Spend Summary

const widgets = importModule("api/widgets");
const bootstrap = importModule("lib/bootstrap");
const layout = importModule("lib/layout");
const theme = importModule("lib/theme");
const { renderSmall } = importModule("components/overview-accessory/small");
const { renderMedium } = importModule("components/overview-accessory/medium");
const { renderLarge } = importModule("components/overview-accessory/large");
const { renderCircular } = importModule("components/overview-accessory/circular");

const { t } = theme;
const { font } = layout;

bootstrap.run(async () => {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();
  if (layout.isAccessory()) widget.noRefreshFooter = true;

  const param = String(args.widgetParameter || "").trim();
  const { totalSpend, perDay, expenseCount } = await widgets.overviewAccessory({ bucketId: param });
  // expenseCount is 0 if not returned; overview currently returns perDay + totalSpend
  // We enrich with expenseCount if available via overview raw (not needed for accessory)

  const family = layout.family();
  switch (family) {
    case "small":
      return renderSmall(widget, { totalSpend });
    case "medium":
      return renderMedium(widget, { totalSpend, perDay });
    case "large":
    case "extraLarge":
      return renderLarge(widget, { totalSpend, perDay, expenseCount });
    case "accessoryCircular":
    case "accessoryInline":
      return renderCircular(widget, { totalSpend });
    case "accessoryRectangular":
    default: {
      // Rectangular accessory: compact 🥘 THIS MONTH + total + perDay
      const { compact } = importModule("lib/money");
      const header = widget.addStack();
      header.layoutHorizontally();
      header.centerAlignContent();
      const icon = header.addText("🥘");
      icon.font = font("regular", 12);
      header.addSpacer(5);
      const title = header.addText("THIS MONTH");
      title.font = font("semibold", 9);
      title.textColor = t("text");
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
    }
  }
});
