// ─────────────────────────────────────────────────────────────────────────────
// components/error.js
// Single error UI component for all widgets.
// Moved from lib/error.js — lib should not contain UI code.
// Used by lib/bootstrap on caught throws, and can be reused inline for
// domain errors (Bucket not found) if desired. Keeps error styling consistent.
// ─────────────────────────────────────────────────────────────────────────────

const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const format = importModule("lib/format");

module.exports = { buildErrorWidget, addErrorState, addInlineError, renderNoBucketId, renderBucketNotFound, renderNoBudget, renderNoData };

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

// ─────────────────────────────────────────────────────────────────────────────
// addInlineError(parent, {title, message, icon}): reusable inline empty/error
// Replaces duplicated `if (!bucket)` / `if (!pick)` blocks across widgets.
// Keeps styling consistent (centered, muted) while allowing custom message.
// All widget empty states should use this instead of inline addText.
// ─────────────────────────────────────────────────────────────────────────────
function addInlineError(parent, { title, message, icon, titleSize = 12, messageSize = 10, titleColor = "muted", messageColor = "muted" } = {}) {
  if (icon) {
    const iconEl = parent.addText(icon);
    iconEl.font = layout.font("regular", 16);
    iconEl.textColor = theme.t("muted");
    iconEl.centerAlignText();
    parent.addSpacer(4);
  }
  const titleEl = parent.addText(title || "Something went wrong");
  titleEl.font = layout.font("semibold", titleSize);
  titleEl.textColor = theme.t(titleColor);
  titleEl.centerAlignText();
  titleEl.lineLimit = 2;
  if (message) {
    parent.addSpacer(4);
    const msgEl = parent.addText(message);
    msgEl.font = layout.font("regular", messageSize);
    msgEl.textColor = theme.t(messageColor);
    msgEl.centerAlignText();
    msgEl.lineLimit = 3;
  }
  return parent;
}

// ── Convenience wrappers for common widget empty states (custom messages) ──
function renderNoBucketId(widget) {
  // Used when `!bucketId` — no bucket resolved from param nor me()
  return addInlineError(widget, {
    title: "Set bucket ID",
    message: "Add bucket ID in widget parameter or log in",
    titleSize: 12,
    messageSize: 9,
    titleColor: "muted",
  });
}

function renderBucketNotFound(widget, bucketId) {
  return addInlineError(widget, {
    title: "Bucket not found",
    message: String(bucketId || ""),
    titleSize: 12,
    messageSize: 8,
    titleColor: "muted",
  });
}

function renderNoBudget(widget, bucketName) {
  return addInlineError(widget, {
    title: bucketName || "Budget",
    message: "No bucket budget",
    titleSize: 12,
    messageSize: 10,
    titleColor: "text",
  });
}

function renderNoData(widget, message = "No data") {
  return addInlineError(widget, {
    title: message,
    titleSize: 12,
    titleColor: "muted",
  });
}
