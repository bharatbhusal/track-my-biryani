// ─────────────────────────────────────────────────────────────────────────────
// lib/bootstrap.js
// Widget lifecycle helper: ensures auth, builds widget, adds refresh footer,
// sets deep link + refresh date, presents in-app preview, handles errors.
// Widgets should only implement `async () => ListWidget` and let bootstrap
// handle session + presentation + error UI (via lib/error.js).
// ─────────────────────────────────────────────────────────────────────────────

const cfg = importModule("config"); // app config (BASE_URL, REFRESH_MINUTES)
const debug = importModule("lib/debug");
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const date = importModule("lib/date");
const errorComp = importModule("lib/error"); // separate error component

module.exports = { run, renderError };

// ─────────────────────────────────────────────────────────────────────────────
// run(build): core widget entry point
// - ensureSession: login if no cookie (via api/client + lib/keychain)
// - build(): widget-specific async function returns ListWidget
// - url + refresh footer + refreshAfterDate
// - setWidget + in-app preview when not running inside a widget
// - catch → renderError (single error component, no crash)
// ─────────────────────────────────────────────────────────────────────────────
async function run(build) {
  try {
    // Ensure we have a valid auth cookie before any API call
    const client = importModule("api/client");
    await client.ensureSession();
    // Let widget build its ListWidget (data already flat via api/widgets)
    const widget = await build();
    // Deep link: tapping widget opens website
    widget.url = cfg.WEBSITE_URL;
    // Add "Refreshed HH:MM" footer unless widget opted out or is accessory
    addRefreshFooter(widget);
    const now = new Date();
    widget.refreshAfterDate = new Date(now.getTime() + cfg.REFRESH_MINUTES * 60000);
    Script.setWidget(widget);
    // In-app preview (Scriptable IDE) — show widget when not in widget host
    // `config` here is Scriptable's GLOBAL config, not our app config
    if (!config.runsInWidget) {
      const fn = layout.isLarge()
        ? "presentLarge"
        : layout.isSmall()
          ? "presentSmall"
          : "presentMedium";
      await widget[fn]();
    }
    Script.complete();
  } catch (e) {
    // Any throw → centralized error UI (no stack trace in widget)
    renderError(e);
    Script.complete();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// addRefreshFooter: appends "Refreshed HH:MM" only for large family
// Per request: except large, no other family shows refresh.
// Opt-out: widget.noRefreshFooter = true OR widget.showRefresh === false
// Accessory is also hidden (redundant with family check but kept for clarity)
// ─────────────────────────────────────────────────────────────────────────────
function addRefreshFooter(widget) {
  if (widget.noRefreshFooter) return; // widget explicitly disabled
  if (widget.showRefresh === false) return; // alternative opt-out flag
  if (layout.isAccessory()) return; // accessory never shows refresh
  if (!layout.isLarge()) return; // only large (incl. extraLarge) shows refresh
  const label = widget.addText(`Refreshed ${date.formatClock24(new Date())}`);
  label.font = layout.font("regular", 10);
  label.textColor = theme.t("muted");
  label.rightAlignText();
}

// ─────────────────────────────────────────────────────────────────────────────
// renderError: delegates to lib/error.js single component for consistency
// ─────────────────────────────────────────────────────────────────────────────
function renderError(e) {
  debug.log(e);
  const widget = errorComp.buildErrorWidget(e);
  Script.setWidget(widget);
  return widget;
}
