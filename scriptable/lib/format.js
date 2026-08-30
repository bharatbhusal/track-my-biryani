module.exports = { pct, truncate, pluralize, blockBar };

function pct(v) {
  return `${Math.round(v * 100)}%`;
}

function truncate(str, n) {
  const s = String(str);
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function pluralize(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function blockBar(value) {
  const filled = Math.max(0, Math.min(16, Math.round(value * 16)));
  return "█".repeat(filled) + "░".repeat(16 - filled);
}
