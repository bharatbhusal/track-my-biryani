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
const errorComp = importModule("components/error");

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

  // ── Shared empty states via error component (no duplicate UI) ──
  if (!bucketId) return errorComp.renderNoBucketId(widget);
  if (!bucket) return errorComp.renderBucketNotFound(widget, bucketId);
  if (!pick) return errorComp.renderNoBudget(widget, bucket.name);

  // ── Layout switch via layout helpers (no plain strings) ──
  if (layout.isSmall()) return renderSmall(widget, { bucket, budget: pick });
  if (layout.isMedium()) return renderMedium(widget, { bucket, budget: pick });
  if (layout.isLarge()) return renderLarge(widget, { bucket, budget: pick });
  if (layout.isCircular() || layout.isInline()) return renderCircular(widget, { bucket, budget: pick });
  // accessoryRectangular is default for all accessory rectangular + fallback
  return renderRectangular(widget, { bucket, budget: pick });
});
