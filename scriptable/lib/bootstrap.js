const cfg = importModule("config");
const debug = importModule("lib/debug");
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const date = importModule("lib/date");
const errorComp = importModule("lib/error");

module.exports = { run, renderError };

async function run(build) {
  try {
    const client = importModule("api/client");
    await client.ensureSession();
    const widget = await build();
    widget.url = cfg.WEBSITE_URL;
    addRefreshFooter(widget);
    const now = new Date();
    widget.refreshAfterDate = new Date(now.getTime() + cfg.REFRESH_MINUTES * 60000);
    Script.setWidget(widget);
    // ponytail: runsInWidget is Scriptable's GLOBAL config, not our settings module
    if (!config.runsInWidget) {
      const f = layout.family();
      const fn =
        f === "large" || f === "extraLarge"
          ? "presentLarge"
          : f === "small"
            ? "presentSmall"
            : "presentMedium";
      await widget[fn]();
    }
    Script.complete();
  } catch (e) {
    renderError(e);
    Script.complete();
  }
}

// ponytail: refreshed time is opt-out — accessory widgets never show it
function addRefreshFooter(widget) {
  if (widget.noRefreshFooter) return;
  if (widget.showRefresh === false) return;
  if (layout.isAccessory()) return;
  const label = widget.addText(`Refreshed ${date.formatClock24(new Date())}`);
  label.font = layout.font("regular", 10);
  label.textColor = theme.t("muted");
  label.rightAlignText();
}

function renderError(e) {
  debug.log(e);
  const widget = errorComp.buildErrorWidget(e);
  Script.setWidget(widget);
  return widget;
}
