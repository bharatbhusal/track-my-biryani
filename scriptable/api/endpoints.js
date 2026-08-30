const { request } = importModule("api/client");

module.exports = {
  overview,
  categories,
  categoriesWithStats,
  distribution,
  expenses,
  buckets,
};

function overview({ from, to, bucketId } = {}) {
  const body = {
    filterCriteria: {
      datePreset: "CUSTOM",
      customFrom: from,
      customTo: to,
      bucketPreset: bucketId ? "MULTIPLE" : "PERSONAL",
      bucketIds: bucketId ? [bucketId] : [],
    },
  };
  return request("/expenses/overview", { method: "POST", body, bucketId });
}

function categories({ bucketId } = {}) {
  const body = {
    filterCriteria: {
      bucketPreset: bucketId ? "MULTIPLE" : "PERSONAL",
      bucketIds: bucketId ? [bucketId] : [],
    },
    sortCriteria: { field: "createdAt", direction: "DESC" },
    pagination: { page: 1, pageSize: 50 },
  };
  return request("/categories/search", { method: "POST", body, bucketId });
}

function categoriesWithStats({ from, to, bucketId } = {}) {
  const body = {
    filterCriteria: {
      datePreset: from && to ? "CUSTOM" : "THIS_MONTH",
      customFrom: from,
      customTo: to,
      bucketPreset: bucketId ? "MULTIPLE" : "PERSONAL",
      bucketIds: bucketId ? [bucketId] : [],
    },
    sortCriteria: { field: "amount", direction: "DESC" },
  };
  const response = request("/categories/stats", { method: "POST", body, bucketId });

  return response.then((res) => {
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
      .filter((item) => item.total > 0 && item.pct > 0)
      .sort((a, b) => b.total - a.total);
  });
}

function distribution({ from, to, bucketId } = {}) {
  const body = {
    dimension: "category",
    filterCriteria: {
      datePreset: from && to ? "CUSTOM" : "THIS_MONTH",
      customFrom: from,
      customTo: to,
      bucketPreset: bucketId ? "MULTIPLE" : "PERSONAL",
      bucketIds: bucketId ? [bucketId] : [],
    },
  };
  return request("/categories/distribution", { method: "POST", body, bucketId });
}

function expenses({
  limit = 5,
  page = 1,
  from,
  to,
  bucketId,
  sortBy = "paidAt",
  order = "desc",
} = {}) {
  const body = {
    filterCriteria: {
      datePreset: from && to ? "CUSTOM" : "THIS_MONTH",
      customFrom: from,
      customTo: to,
      bucketPreset: bucketId ? "MULTIPLE" : "PERSONAL",
      bucketIds: bucketId ? [bucketId] : [],
    },
    sortCriteria: { field: sortBy, direction: order.toUpperCase() },
    pagination: { page, pageSize: limit },
  };
  return request("/expenses/search", { method: "POST", body, bucketId });
}

function buckets() {
  const body = {
    filterCriteria: { datePreset: "THIS_MONTH" },
    sortCriteria: { field: "createdAt", direction: "DESC" },
    pagination: { page: 1, pageSize: 20 },
  };
  return request("/buckets/search", { method: "POST", body });
}
