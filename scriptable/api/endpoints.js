const { request } = importModule("api/client");

module.exports = {
  overview,
  categories,
  categoriesWithStats,
  distribution,
  expenses,
  buckets,
  budgets,
  authMe,
};

function overview({ bucketId } = {}) {
  const body = {
    filterCriteria: {
      datePreset: "THIS_MONTH",
      bucketPreset: bucketId ? "MULTIPLE" : "PERSONAL",
      bucketIds: bucketId ? [bucketId] : [],
    },
  };
  return request("/expenses/overview", { method: "POST", body });
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
  const response = request("/categories/stats", { method: "POST", body });

  return response.then((res) => {
    if (!res?.items) return [];
    return res.items.map((item) => ({
      name: item.name || "Other",
      emoji: item.emoji || "💸",
      color: item.color || "#999999",
      total: Number(item.stats?.total) || 0,
      pct: Number(item.stats?.pct) || 0,
      count: Number(item.stats?.count) || 0,
    }));
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
  return request("/expenses/search", { method: "POST", body });
}

function buckets({ page = 1, pageSize = 4 } = {}) {
  const body = {
    filterCriteria: { datePreset: "THIS_MONTH" },
    sortCriteria: { field: "createdAt", direction: "DESC" },
    pagination: { page, pageSize },
  };
  return request("/buckets/search", { method: "POST", body });
}

function budgets() {
  return request("/budgets");
}
