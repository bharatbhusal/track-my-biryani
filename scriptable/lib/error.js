const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const format = importModule("lib/format");

module.exports = { buildErrorWidget, addErrorState };

function buildErrorWidget(e) {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();
  addErrorState(widget, e);
  return widget;
}

function addErrorState(parent, e) {
  const title = parent.addText(format.truncate(String(e?.message || e || "Unknown error"), 80));
  title.font = layout.font("semibold", 12);
  title.textColor = theme.t("danger");
  title.lineLimit = 2;
  parent.addSpacer(4);
  const hint = parent.addText(
    "Check DEBUG logs. Set RESET_CREDENTIALS=true in config.js to re-enter credentials.",
  );
  hint.font = layout.font("regular", 9);
  hint.textColor = theme.t("muted");
  hint.lineLimit = 3;
  return parent;
}
