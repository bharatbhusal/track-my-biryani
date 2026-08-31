// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: magic;
// Track My Biryani — category spending breakdown
// Shows monthly spending distribution by category.

const widgets = importModule("api/widgets");
const bootstrap = importModule("lib/bootstrap");
const layout = importModule("lib/layout");
const components = importModule("lib/components");
const theme = importModule("lib/theme");
const moneyLib = importModule("lib/money");

const { footer, stackedCategoryBar, categoryBar, categoryCompactBar } = components;
const { t } = theme;
const { font } = layout;
const { moneyShort } = moneyLib;

bootstrap.run(async () => {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();

  const family = layout.family();
  const isLarge = family === "large";
  const isAccessory = layout.isAccessory();
  if (isAccessory) widget.noRefreshFooter = true;

  const param = String(args.widgetParameter || "").trim();
  const { bucket, bucketId, bucketName, categories, totalSpend } = await widgets.categoryMonth({
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

  if (isAccessory) {
    if (!categories.length) {
      const empty = widget.addText("No spending");
      empty.font = font("regular", 10);
      empty.textColor = t("muted");
      return widget;
    }
    const top = categories.slice(0, 3);
    for (let i = 0; i < top.length; i++) {
      categoryCompactBar(widget, top[i]);
      if (i < top.length - 1) widget.addSpacer(4);
    }
    return widget;
  }

  const header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();
  const title = header.addText(`Where It Went · ${bucketName}`);
  title.font = font("semibold", isLarge ? 15 : 14);
  title.textColor = t("text");
  title.lineLimit = 1;
  header.addSpacer();
  const subtitle = header.addText("This Month");
  subtitle.font = font("regular", 9);
  subtitle.textColor = t("muted");

  if (!categories.length) {
    widget.addSpacer(10);
    const empty = widget.addText("No category spending yet");
    empty.font = font("regular", 10);
    empty.textColor = t("muted");
    widget.addSpacer();
    footer(widget, { left: bucketName, right: "₹0" });
    return widget;
  }

  let visibleCategories;
  if (isLarge) visibleCategories = categories.slice(0, 10);
  else visibleCategories = categories.slice(0, 4);

  widget.addSpacer(9);
  stackedCategoryBar(widget, categories);
  widget.addSpacer(10);

  for (let i = 0; i < visibleCategories.length; i++) {
    categoryBar(widget, visibleCategories[i], true);
    if (i < visibleCategories.length - 1) widget.addSpacer(isLarge ? 6 : 5);
  }

  const remaining = categories.length - visibleCategories.length;
  if (remaining > 0) {
    widget.addSpacer(5);
    const more = widget.addText(`+${remaining} more categor${remaining === 1 ? "y" : "ies"}`);
    more.font = font("regular", 8);
    more.textColor = t("muted");
  }

  widget.addSpacer();
  footer(widget, {
    left: `${categories.length} categor${categories.length === 1 ? "y" : "ies"}`,
    right: moneyShort(totalSpend),
  });

  return widget;
});
