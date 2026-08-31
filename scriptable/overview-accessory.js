// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: magic;
// Track My Biryani — Lock Screen rectangular
// Monthly total spend + daily spending average.

const widgets = importModule("api/widgets");
const bootstrap = importModule("lib/bootstrap");
const layout = importModule("lib/layout");
const theme = importModule("lib/theme");
const moneyLib = importModule("lib/money");

const { t } = theme;
const { font } = layout;
const { compact } = moneyLib;

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
  const { totalSpend, perDay } = await widgets.overviewAccessory({ bucketId: param });

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
});
