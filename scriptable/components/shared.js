// ─────────────────────────────────────────────────────────────────────────────
// components/shared.js
// Shared UI primitives used across multiple Scriptable widgets.
// Keeps low-level layout, color and typography helpers in one place
// so per-widget files stay small and focused.
// ─────────────────────────────────────────────────────────────────────────────

const format = importModule("lib/format");
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");

// Theme + layout shortcuts — used in every component below.
const { t } = theme;
const { font } = layout;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: safely create a Color, fallback to gray if hex is invalid.
// Scriptable throws on bad hex, so we never let a widget crash on color.
// ─────────────────────────────────────────────────────────────────────────────
function safeColor(value) {
  try {
    return new Color(value || "#999999");
  } catch {
    return new Color("#999999");
  }
}

// Capitalizes period strings: "monthly" → "Monthly"
function capPeriod(s) {
  const str = String(s || "");
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

module.exports = {
  safeColor,
  capPeriod,
  header,
  stat,
  statRow,
  progressBar,
  listRow,
  chip,
  divider,
  card,
  footer,
  budgetBar,
};

// ─────────────────────────────────────────────────────────────────────────────
// Generic header row: optional icon (emoji or SFSymbol) + title + subtitle
// ─────────────────────────────────────────────────────────────────────────────
function header(parent, { icon, title, subtitle }) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.spacing = 6;
  if (icon) {
    // Long icon strings are treated as SFSymbol names, short as emoji
    if (icon.length > 2) {
      const img = SFSymbol.named(icon).image;
      img.tintColor = t("accent");
      const iconStack = row.addStack();
      iconStack.addImage(img);
      iconStack.imageSize = new Size(22, 22);
    } else {
      const e = row.addText(icon);
      e.font = font("medium", 16);
    }
  }
  const titleLabel = row.addText(title);
  titleLabel.font = font("semibold", 16);
  titleLabel.textColor = t("text");
  row.addSpacer();
  if (subtitle) {
    const sub = row.addText(subtitle);
    sub.font = font("regular", 12);
    sub.textColor = t("muted");
  }
  return row;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat column: label on top, emphasized value below
// ─────────────────────────────────────────────────────────────────────────────
function stat(parent, { label, value, color, emphasis }) {
  const stack = parent.addStack();
  stack.layoutVertically();
  stack.spacing = 2;
  const labelEl = stack.addText(label);
  labelEl.font = font("regular", 11);
  labelEl.textColor = t("muted");
  const valueEl = stack.addText(String(value));
  valueEl.font = font(emphasis ? "bold" : "semibold", emphasis ? 24 : 18);
  valueEl.textColor = color || t("text");
  return stack;
}

// ─────────────────────────────────────────────────────────────────────────────
// Row of stats, evenly spaced. Used for overview numbers.
// ─────────────────────────────────────────────────────────────────────────────
function statRow(parent, stats) {
  const row = parent.addStack();
  row.layoutHorizontally();
  stats.forEach((s, i) => {
    if (i > 0) row.addSpacer();
    stat(row, s);
    row.addSpacer();
  });
  return row;
}

// ─────────────────────────────────────────────────────────────────────────────
// Monospace block bar (text mode) — lightweight progress indicator
// ─────────────────────────────────────────────────────────────────────────────
function progressBar(parent, { value, color }) {
  const label = parent.addText(format.blockBar(value));
  label.font = font("mono", 11);
  label.textColor = color || t("accent");
  return label;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic list row: emoji + vertical title/subtitle + right amount
// ─────────────────────────────────────────────────────────────────────────────
function listRow(parent, { emoji, title, amount, right, subtitle, color }) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.spacing = 6;
  if (emoji) {
    const e = row.addText(emoji);
    e.font = font("regular", 14);
  }
  const textStack = row.addStack();
  textStack.layoutVertically();
  const titleLabel = textStack.addText(format.truncate(title, 18));
  titleLabel.font = font("semibold", 13);
  titleLabel.textColor = color ? new Color(color) : t("text");
  if (subtitle) {
    const sub = textStack.addText(subtitle);
    sub.font = font("regular", 11);
    sub.textColor = t("muted");
  }
  row.addSpacer();
  if (amount !== undefined && amount !== null) {
    const a = row.addText(String(amount));
    a.font = font("semibold", 13);
    a.textColor = color ? new Color(color) : t("text");
  } else if (right) {
    const r = row.addText(right);
    r.font = font("regular", 12);
    r.textColor = t("muted");
  }
  return row;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pill / chip tag, e.g. for category labels
// ─────────────────────────────────────────────────────────────────────────────
function chip(parent, { text, color }) {
  const stack = parent.addStack();
  stack.cornerRadius = 6;
  stack.setPadding(4, 8, 4, 8);
  stack.backgroundColor = color ? new Color(color, 0.15) : t("card");
  const label = stack.addText(text);
  label.font = font("semibold", 11);
  label.textColor = color ? new Color(color) : t("text");
  return stack;
}

// ─────────────────────────────────────────────────────────────────────────────
// Thin divider line
// ─────────────────────────────────────────────────────────────────────────────
function divider(parent, color) {
  const line = parent.addStack();
  line.size = new Size(0, 1);
  line.backgroundColor = color || t("border");
  return line;
}

// ─────────────────────────────────────────────────────────────────────────────
// Card container with rounded corners and padding
// ─────────────────────────────────────────────────────────────────────────────
function card(parent, { color } = {}) {
  const stack = parent.addStack();
  stack.layoutVertically();
  stack.cornerRadius = 14;
  stack.setPadding(10, 10, 10, 10);
  stack.backgroundColor = color || t("card");
  return stack;
}

// ─────────────────────────────────────────────────────────────────────────────
// Footer row: left + right small muted text, used for totals
// ─────────────────────────────────────────────────────────────────────────────
function footer(parent, { left, right }) {
  const row = parent.addStack();
  row.layoutHorizontally();
  const l = row.addText(left);
  l.font = font("regular", 11);
  l.textColor = t("muted");
  row.addSpacer();
  const r = row.addText(right);
  r.font = font("regular", 11);
  r.textColor = t("muted");
  return row;
}

// ─────────────────────────────────────────────────────────────────────────────
// Budget progress bar (sibling filled + track, flush left, no gap)
// Shared by all budget widgets — hero, card, summary
// ─────────────────────────────────────────────────────────────────────────────
function budgetBar(parent, { pct, width = 320, trackColor, spent, target, height = 6 } = {}) {
  const raw = Number(pct) || 0;
  const clamped = Math.max(0, Math.min(100, raw));
  const ratio = clamped / 100;
  const fill = Math.round(width * ratio);
  const track = trackColor || t("border");
  const isOver =
    raw >= 100 || (typeof spent === "number" && typeof target === "number" && spent > target);
  const fillColor = isOver ? t("danger") : clamped > 85 ? t("warning") : t("success");
  const row = parent.addStack();
  row.layoutHorizontally();
  if (fill > 0) {
    const filled = row.addStack();
    filled.size = new Size(Math.min(fill, width), height);
    filled.cornerRadius = height / 2;
    filled.backgroundColor = fillColor;
  }
  if (fill < width) {
    const rest = row.addStack();
    rest.size = new Size(width - Math.min(fill, width), height);
    rest.cornerRadius = height / 2;
    rest.backgroundColor = track;
  }
  return row;
}
