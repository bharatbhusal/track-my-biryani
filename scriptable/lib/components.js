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

    const width = Math.max(1, Math.round(300 * (category.pct / Math.max(totalPct, 1))));

    segment.size = new Size(width, 10);
    segment.backgroundColor = safeColor(category.color);

    if (i === 0 || i === categories.length - 1) {
      segment.cornerRadius = 5;
    }
  }

  return row;
}
