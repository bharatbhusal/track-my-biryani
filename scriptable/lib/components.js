const format = importModule("lib/format");
const theme = importModule("lib/theme");
const layout = importModule("lib/layout");
const moneyLib = importModule("lib/money");
const date = importModule("lib/date");

const { t } = theme;
const { font } = layout;
const { moneyShort } = moneyLib;
const { relativeDay } = date;

function safeColor(value) {
  try {
    return new Color(value || "#999999");
  } catch {
    return new Color("#999999");
  }
}

module.exports = {
  header,
  stat,
  statRow,
  progressBar,
  listRow,
  chip,
  divider,
  card,
  footer,
  expenseBar,
  categoryBar,
  categoryCompactBar,
  stackedCategoryBar,
  budgetBallTrack,
  budgetBar,
  budgetSummary,
  budgetCard,
  budgetHeroCard,
};

function header(parent, { icon, title, subtitle }) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.spacing = 6;
  if (icon) {
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

function progressBar(parent, { value, color }) {
  const label = parent.addText(format.blockBar(value));
  label.font = font("mono", 11);
  label.textColor = color || t("accent");
  return label;
}

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

function divider(parent, color) {
  const line = parent.addStack();
  line.size = new Size(0, 1);
  line.backgroundColor = color || t("border");
  return line;
}

function card(parent, { color } = {}) {
  const stack = parent.addStack();
  stack.layoutVertically();
  stack.cornerRadius = 14;
  stack.setPadding(10, 10, 10, 10);
  stack.backgroundColor = color || t("card");
  return stack;
}

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

function expenseBar(parent, expense) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const emoji = row.addText(expense.categoryEmoji || "💸");
  emoji.font = font("regular", 15);

  row.addSpacer(7);

  const indicator = row.addStack();
  indicator.size = new Size(5, 22);
  indicator.cornerRadius = 2.5;
  indicator.backgroundColor = safeColor(expense.categoryColor || "#999999");

  row.addSpacer(7);

  const title = row.addText(expense.title || "Expense");
  title.font = font("regular", 11);
  title.textColor = t("text");
  title.lineLimit = 1;

  row.addSpacer();

  const paidAt = row.addText(relativeDay(expense.paidAt));
  paidAt.font = font("regular", 10);
  paidAt.textColor = t("muted");

  row.addSpacer(8);

  const amount = row.addText(moneyShort(Number(expense.amount) || 0));
  amount.font = font("semibold", 11);
  amount.textColor = t("text");
  amount.rightAlignText();

  return row;
}

function categoryBar(parent, category, { showAmount = true } = {}) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const emoji = row.addText(category.emoji);
  emoji.font = font("regular", 14);

  row.addSpacer(6);

  const indicator = row.addStack();
  indicator.size = new Size(4, 18);
  indicator.cornerRadius = 2;
  indicator.backgroundColor = safeColor(category.color);

  row.addSpacer(7);

  const name = row.addText(category.name);
  name.font = font("regular", 10);
  name.textColor = t("text");
  name.lineLimit = 1;

  row.addSpacer();

  if (showAmount) {
    const amount = row.addText(moneyShort(category.total));
    amount.font = font("regular", 10);
    amount.textColor = t("muted");
    row.addSpacer(8);
  }

  const pct = row.addText(`${category.pct}%`);
  pct.font = font("semibold", 10);
  pct.textColor = t("text");
  pct.rightAlignText();

  return row;
}

function categoryCompactBar(parent, category) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const emoji = row.addText(category.emoji);
  emoji.font = font("regular", 13);

  row.addSpacer(5);

  const indicator = row.addStack();
  indicator.size = new Size(3, 14);
  indicator.cornerRadius = 1.5;
  indicator.backgroundColor = safeColor(category.color);

  row.addSpacer(5);

  const name = row.addText(category.name);
  name.font = font("regular", 9);
  name.textColor = t("text");
  name.lineLimit = 1;

  row.addSpacer();

  const pct = row.addText(`${category.pct}%`);
  pct.font = font("semibold", 9);
  pct.textColor = safeColor(category.color);

  return row;
}

function stackedCategoryBar(parent, categories) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.size = new Size(0, 10);
  row.cornerRadius = 5;

  if (!categories.length) {
    row.backgroundColor = t("border");
    return row;
  }

  const totalPct = categories.reduce((sum, c) => sum + c.pct, 0);

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const segment = row.addStack();

    const width = Math.max(1, Math.round(320 * (category.pct / Math.max(totalPct, 1))));

    segment.size = new Size(width, 10);
    segment.backgroundColor = safeColor(category.color);

    if (i === 0 || i === categories.length - 1) {
      segment.cornerRadius = 5;
    }
  }

  return row;
}

function capPeriod(s) {
  const str = String(s || "");
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

function budgetBar(parent, { pct, width = 320, trackColor, spent, target, height = 6 } = {}) {
  const raw = Number(pct) || 0;
  const clamped = Math.max(0, Math.min(100, raw));
  const ratio = clamped / 100;
  const fill = Math.round(width * ratio);
  const track = trackColor || t("border");
  const isOver =
    raw >= 100 || (typeof spent === "number" && typeof target === "number" && spent > target);
  const fillColor = isOver ? t("danger") : clamped > 85 ? t("warning") : t("success");
  // ponytail: sibling filled+track (like month-overview bar) — no nested child, flush left, no left gap
  const row = parent.addStack();
  row.layoutHorizontally();
  // row background transparent; two children define the bar
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
  // fix: ensure row itself clips corners when partially filled by setting outer container
  // alternative to nested, sibling guarantees left edge flush (no centered child gap)
  return row;
}

function budgetBallTrack(parent, { pct, width = 320, trackColor, spent, target } = {}) {
  const raw = Number(pct) || 0;
  const clamped = Math.max(0, Math.min(100, raw));
  const ratio = clamped / 100;
  const fill = Math.round(width * ratio);
  const track = trackColor || t("border");
  const isOver =
    raw >= 100 || (typeof spent === "number" && typeof target === "number" && spent > target);
  // ponytail: red for over, green for under control — from theme.js success/danger
  const fillColor = isOver ? t("danger") : clamped > 85 ? t("warning") : t("success");

  const showBall = !isOver && raw > 0 && raw < 100;

  if (showBall) {
    const wrap = parent.addStack();
    wrap.layoutVertically();
    wrap.size = new Size(width, 16);
    wrap.spacing = 0;

    const ballRow = wrap.addStack();
    ballRow.layoutHorizontally();
    ballRow.size = new Size(width, 10);
    const ballOffset = Math.max(0, Math.min(width - 10, fill - 5));
    if (ballOffset > 0) {
      const sp = ballRow.addStack();
      sp.size = new Size(ballOffset, 10);
    }
    const ball = ballRow.addStack();
    ball.size = new Size(10, 10);
    ball.cornerRadius = 5;
    ball.backgroundColor = fillColor;
    ball.borderWidth = 1.2;
    ball.borderColor = new Color("#ffffff", 1);
    ballRow.addSpacer();

    const trackRow = wrap.addStack();
    trackRow.layoutHorizontally();
    trackRow.size = new Size(width, 6);
    trackRow.cornerRadius = 3;
    trackRow.backgroundColor = track;
    if (fill > 0) {
      const filled = trackRow.addStack();
      filled.size = new Size(Math.min(fill, width), 6);
      filled.cornerRadius = 3;
      filled.backgroundColor = fillColor;
    }
    return wrap;
  }

  return budgetBar(parent, { pct: raw, width, trackColor: track, spent, target, height: 6 });
}

function budgetSummary(
  parent,
  { spent, target, pct, currentDay, totalDays, period, width, compactMode } = {},
) {
  const spentStr = moneyLib.compact(spent);
  const targetStr = moneyLib.compact(target);
  const raw = Number(pct) || 0;
  const isOver = raw >= 100 || spent > target;
  const fillColor = isOver ? t("danger") : raw > 85 ? t("warning") : t("success");

  const line1 = parent.addStack();
  line1.layoutHorizontally();
  line1.centerAlignContent();
  const left = line1.addText(`${spentStr} of ${targetStr}`);
  left.font = font("semibold", compactMode ? 13 : 15);
  left.textColor = t("text");
  left.lineLimit = 1;
  line1.addSpacer();
  const right = line1.addText(`${Math.round(raw)}%`);
  right.font = font("semibold", compactMode ? 11 : 12);
  right.textColor = fillColor;
  right.rightAlignText();

  parent.addSpacer(7);
  budgetBallTrack(parent, { pct: raw, spent, target, width: width || 320 });
  parent.addSpacer(7);

  if (typeof currentDay === "number" && typeof totalDays === "number") {
    const line3 = parent.addStack();
    line3.layoutHorizontally();
    line3.centerAlignContent();
    const dayLabel = line3.addText(`Day ${currentDay} of ${totalDays}`);
    dayLabel.font = font("regular", compactMode ? 9 : 10);
    dayLabel.textColor = t("muted");
    line3.addSpacer();
    if (period) {
      const periodLabel = line3.addText(String(period));
      periodLabel.font = font("regular", compactMode ? 8 : 9);
      periodLabel.textColor = t("muted");
      periodLabel.rightAlignText();
    }
  }
  return parent;
}

function budgetCard(
  parent,
  { title, emoji, indicatorColor, period, spent, target, pct, width = 320, compactMode } = {},
) {
  const raw = Number(pct) || 0;
  const isOver = raw >= 100 || spent > target;

  // row like categoryBar: emoji, vertical line with category/default color, name, period variant, amount
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const e = row.addText(emoji || (title === "Bucket budget" ? "💰" : "🏷️"));
  e.font = font("regular", compactMode ? 13 : 14);
  row.addSpacer(6);

  const indicator = row.addStack();
  indicator.size = new Size(4, 18);
  indicator.cornerRadius = 2;
  indicator.backgroundColor = safeColor(indicatorColor || "#999999");
  row.addSpacer(7);

  const nameEl = row.addText(title || "Budget");
  nameEl.font = font("regular", compactMode ? 10 : 11);
  nameEl.textColor = t("text");
  nameEl.lineLimit = 1;
  row.addSpacer();

  if (period) {
    const per = row.addText(capPeriod(period));
    per.font = font("regular", compactMode ? 8 : 9);
    per.textColor = t("muted");
    row.addSpacer(8);
  }

  const amountEl = row.addText(moneyLib.compact(target));
  amountEl.font = font("semibold", compactMode ? 10 : 11);
  amountEl.textColor = t("text");
  amountEl.rightAlignText();

  parent.addSpacer(6);

  budgetBar(parent, { pct: raw, spent, target, width, height: 6 });

  parent.addSpacer(4);

  const bottom = parent.addStack();
  bottom.layoutHorizontally();
  const spentEl = bottom.addText(`${moneyLib.compact(spent)} spent`);
  spentEl.font = font("regular", compactMode ? 8 : 9);
  spentEl.textColor = t("muted");
  bottom.addSpacer();
  const leftPct = isOver ? Math.round(raw - 100) : Math.round(100 - raw);
  const rightText = isOver ? `${leftPct}% over` : `${leftPct}% left`;
  const rightEl = bottom.addText(rightText);
  rightEl.font = font(isOver ? "semibold" : "regular", compactMode ? 8 : 9);
  rightEl.textColor = isOver ? t("danger") : t("muted");
  rightEl.rightAlignText();

  return parent;
}

function budgetHeroCard(
  parent,
  { title, emoji, period, spent, target, pct, width = 320, compactMode } = {},
) {
  const raw = Number(pct) || 0;
  const isOver = raw >= 100 || spent > target;
  const fillColor = isOver ? t("danger") : raw > 85 ? t("warning") : t("success");

  const hero = parent.addStack();
  hero.layoutVertically();

  // header: emoji + title + period caps pill on right
  const headerRow = hero.addStack();
  headerRow.layoutHorizontally();
  headerRow.centerAlignContent();
  const e = headerRow.addText(emoji || "💰");
  e.font = font("regular", compactMode ? 14 : 16);
  headerRow.addSpacer(6);
  const nameEl = headerRow.addText(title || "Bucket Budget");
  nameEl.font = font("semibold", compactMode ? 13 : 14);
  nameEl.textColor = t("text");
  nameEl.lineLimit = 1;
  headerRow.addSpacer();
  if (period) {
    const per = headerRow.addText(capPeriod(period));
    per.font = font("semibold", 8);
    per.textColor = t("muted");
  }

  hero.addSpacer(10);

  // big numbers: spent of target
  const amountRow = hero.addStack();
  amountRow.layoutHorizontally();
  amountRow.centerAlignContent();
  const spentEl = amountRow.addText(moneyLib.compact(spent));
  spentEl.font = font("bold", compactMode ? 20 : 22);
  spentEl.textColor = fillColor;
  amountRow.addSpacer(6);
  const ofEl = amountRow.addText("of");
  ofEl.font = font("regular", compactMode ? 11 : 12);
  ofEl.textColor = t("muted");
  amountRow.addSpacer(6);
  const targetEl = amountRow.addText(moneyLib.compact(target));
  targetEl.font = font("semibold", compactMode ? 13 : 14);
  targetEl.textColor = t("text");
  amountRow.addSpacer();
  const pctEl = amountRow.addText(`${Math.round(raw)}%`);
  pctEl.font = font("semibold", compactMode ? 12 : 13);
  pctEl.textColor = fillColor;
  pctEl.rightAlignText();

  hero.addSpacer(10);

  // simple filled bar — hero uses thicker 8pt bar, full width (no card padding)
  budgetBar(hero, { pct: raw, spent, target, width: width, height: 8 });

  hero.addSpacer(6);

  const bottom = hero.addStack();
  bottom.layoutHorizontally();
  const leftPct = isOver ? Math.round(raw - 100) : Math.round(100 - raw);
  const leftText = isOver ? `${leftPct}% over budget` : `${leftPct}% remaining`;
  const leftEl = bottom.addText(leftText);
  leftEl.font = font(isOver ? "semibold" : "regular", 9);
  leftEl.textColor = isOver ? t("danger") : t("muted");
  bottom.addSpacer();
  const rightEl = bottom.addText(`${moneyLib.compact(spent)} spent`);
  rightEl.font = font("regular", 9);
  rightEl.textColor = t("muted");
  rightEl.rightAlignText();

  return hero;
}
