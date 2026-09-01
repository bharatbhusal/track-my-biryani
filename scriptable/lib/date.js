module.exports = {
  currentMonthRange,
  rangeForDays,
  currentMonthProgress,
  budgetPeriodProgress,
  formatDay,
  relativeDay,
  formatClock,
  formatClock24,
  projectSpend,
};

const DAY_LABEL = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
});

function currentMonthRange() {
  const now = new Date();

  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

function rangeForDays(n) {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date(to);
  from.setDate(to.getDate() - (n - 1));
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}

function currentMonthProgress() {
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return {
    currentDay,
    daysInMonth,
    progress: currentDay / daysInMonth,
  };
}

function budgetPeriodProgress(period) {
  const now = new Date();
  if (period === "weekly") {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    const currentDay = Math.floor((now - monday) / 86400000) + 1;
    return { currentDay, totalDays: 7, progress: currentDay / 7 };
  }
  if (period === "yearly") {
    const start = new Date(now.getFullYear(), 0, 1);
    const isLeap = new Date(now.getFullYear(), 1, 29).getDate() === 29;
    const total = isLeap ? 366 : 365;
    const diff = Math.floor((now - start) / 86400000) + 1;
    return { currentDay: diff, totalDays: total, progress: diff / total };
  }
  // monthly (default)
  const { currentDay, daysInMonth, progress } = currentMonthProgress();
  return { currentDay, totalDays: daysInMonth, progress };
}

function formatDay(iso) {
  return DAY_LABEL.format(new Date(iso));
}

function localDateISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function relativeDay(iso) {
  const day = localDateISO(new Date(iso));
  const today = localDateISO(new Date());
  if (day === today) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (day === localDateISO(yesterday)) return "Yesterday";
  return formatDay(iso);
}

function formatClock(date) {
  let h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function formatClock24(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function projectSpend(perDay, daysInMonth) {
  return perDay * daysInMonth;
}
