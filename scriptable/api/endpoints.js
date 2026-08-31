const { request } = importModule("api/client");

module.exports = {
  overview,
  categoriesWithStats,
  expenses,
  buckets,
  budgets,
};

function overview({ bucketId } = {}) {
  const body = {
    filterCriteria: {
      datePreset: "THIS_MONTH",
      bucketPreset: bucketId ? "MULTIPLE" : "PERSONAL",
      bucketIds: bucketId ? [bucketId] : [],
    },
  };
  return request("/expenses/overview", { method: "POST", body }).then((rows) => {
    const stats = {};
    for (const row of Array.isArray(rows) ? rows : []) stats[row.key] = Number(row.value) || 0;
    return {
      totalSpend: stats.total_spend || 0,
      perDay: stats.spend_per_day || 0,
      expenseCount: stats.expense_count || 0,
      categoriesCount: stats.categories_count || 0,
      avgAmount: stats.avg_amount || 0,
      minAmount: stats.min_amount || 0,
      maxAmount: stats.max_amount || 0,
      raw: Array.isArray(rows) ? rows : [],
    };
  });
}

function categoriesWithStats({ bucketId } = {}) {
  const body = {
    filterCriteria: {
      datePreset: "THIS_MONTH",
      bucketPreset: bucketId ? "MULTIPLE" : "PERSONAL",
      bucketIds: bucketId ? [bucketId] : [],
    },
    sortCriteria: { field: "amount", direction: "DESC" },
  };
  return request("/categories/stats", { method: "POST", body }).then((res) => {
    if (!res?.items) return [];
    return res.items
      .map((item) => ({
        name: item.name || "Other",
        emoji: item.emoji || "💸",
        color: item.color || "#999999",
        total: Number(item.stats?.total) || 0,
        pct: Number(item.stats?.pct) || 0,
        count: Number(item.stats?.count) || 0,
      }))
      .filter((c) => c.total > 0 && c.pct > 0)
      .sort((a, b) => b.total - a.total);
  });
}

function expenses({ pageSize = 6, page = 1, bucketId } = {}) {
  const body = {
    filterCriteria: {
      datePreset: "THIS_MONTH",
      bucketPreset: bucketId ? "MULTIPLE" : "PERSONAL",
      bucketIds: bucketId ? [bucketId] : [],
    },
    sortCriteria: { field: "paidAt", direction: "DESC" },
    pagination: { page, pageSize },
  };
  return request("/expenses/search", { method: "POST", body }).then((res) => ({
    items: Array.isArray(res?.items)
      ? res.items.map((e) => ({ ...e, amount: Number(e.amount) || 0 }))
      : [],
    total: Number(res?.total) || 0,
    page: Number(res?.page) || page,
    totalPages: Number(res?.totalPages) || 1,
  }));
}

function buckets({ page = 1, pageSize = 4 } = {}) {
  const body = {
    filterCriteria: { datePreset: "THIS_MONTH" },
    sortCriteria: { field: "createdAt", direction: "DESC" },
    pagination: { page, pageSize },
  };
  return request("/buckets/search", { method: "POST", body }).then((res) =>
    Array.isArray(res?.items) ? res.items : [],
  );
}

function budgets({ bucketId } = {}) {
  return request("/budgets").then((groups) => {
    const flat = Array.isArray(groups)
      ? groups.flatMap((g) => (Array.isArray(g.budgets) ? g.budgets : []))
      : [];
    const filtered = bucketId ? flat.filter((b) => b && b.bucketId === bucketId) : flat;
    return filtered.map((b) => ({
      _id: b._id,
      id: b._id,
      bucketId: b.bucketId,
      bucketName: b.bucketName,
      bucketIcon: b.bucketIcon,
      categoryId: b.categoryId ?? null,
      categoryName: b.categoryName || null,
      categoryColor: b.categoryColor || "#999999",
      categoryEmoji: b.categoryEmoji || "🏷️",
      amount: Number(b.amount) || 0,
      spent: Number(b.spent) || 0,
      remaining: Number(b.remaining) || 0,
      pct: Number(b.pct) || 0,
      period: b.period,
    }));
  });
}
