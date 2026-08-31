// ─────────────────────────────────────────────────────────────────────────────
// lib/error.js
// Single error UI component for all widgets.
// Used by lib/bootstrap on caught throws, and can be reused inline for
// domain errors (Bucket not found) if desired. Keeps error styling consistent.
// ─────────────────────────────────────────────────────────────────────────────

const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const format = importModule("lib/format");

module.exports = { buildErrorWidget, addErrorState };

// ─────────────────────────────────────────────────────────────────────────────
// buildErrorWidget(e): creates a full ListWidget with error state
// Used for hard failures (auth, network, unhandled). Background is clear
// so it respects light/dark via theme.
// ─────────────────────────────────────────────────────────────────────────────
function buildErrorWidget(e) {
  const widget = new ListWidget();
  widget.backgroundColor = theme.background();
  addErrorState(widget, e);
  return widget;
}

// ─────────────────────────────────────────────────────────────────────────────
// addErrorState(parent, e): inline error message + hint
// Title is truncated to 80 chars, danger color, 2 lines.
// Hint is muted, tells user to check DEBUG or reset credentials.
// Can be added to any parent Stack/Widget.
// ─────────────────────────────────────────────────────────────────────────────
function addErrorState(parent, e) {
  // Title: error message or stringified error, max 80 chars
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
