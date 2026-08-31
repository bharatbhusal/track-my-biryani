// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: wallet;
// Track My Biryani — Budget Progress (All Sizes)
// Shows bucket budget progress — supports small, medium, large, circular & rectangular.
// WidgetParameter: optional bucketId override; defaults to me().bucketId
// Appropriate name: Budget Progress Tracker

// ─────────────────────────────────────────────────────────────────────────────
// Imports: flat data + bootstrap + layout/theme + per-size layouts
// ─────────────────────────────────────────────────────────────────────────────
const widgets = importModule("api/widgets");
const bootstrap = importModule("lib/bootstrap");
const layout = importModule("lib/layout");
const theme = importModule("lib/theme");
const date = importModule("lib/date");
const { renderRectangular } = importModule("components/budget-accessory/rectangular");
const { renderSmall } = importModule("components/budget-accessory/small");
const { renderMedium } = importModule("components/budget-accessory/medium");
const { renderLarge } = importModule("components/budget-accessory/large");
const { renderCircular } = importModule("components/budget-accessory/circular");

const { t } = theme;
const { font } = layout;

// ─────────────────────────────────────────────────────────────────────────────
// Main: resolves bucket/budget once, then switches on family for layout.
// Accessory families hide refresh footer; home screen families show it.
// ─────────────────────────────────────────────────────────────────────────────
bootstrap.run(async () => {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();

  // Hide refresh for all accessory families (circular/rectangular/inline)
  if (layout.isAccessory()) widget.noRefreshFooter = true;

  // ── Data: single flat call (param || me) ──
  const param = String(args.widgetParameter || "").trim();
  const { bucket, budget: pick, bucketId } = await widgets.budgetAccessory({ bucketId: param });

  // ── Shared empty states (all sizes) ──
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

  // ── Layout switch via layout helpers (no plain strings) ──
  if (layout.isSmall()) return renderSmall(widget, { bucket, budget: pick });
  if (layout.isMedium()) return renderMedium(widget, { bucket, budget: pick });
  if (layout.isLarge()) return renderLarge(widget, { bucket, budget: pick });
  if (layout.isCircular() || layout.isInline()) return renderCircular(widget, { bucket, budget: pick });
  // accessoryRectangular is default for all accessory rectangular + fallback
  return renderRectangular(widget, { bucket, budget: pick });
});
