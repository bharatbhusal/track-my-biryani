const auth = importModule("api/auth");
const endpoints = importModule("api/endpoints");

module.exports = {
  budgetAccessory,
  budgetsWidget,
  categoryMonth,
  monthOverview,
  overviewAccessory,
};

async function resolveBucketId(paramId) {
  let bucketId = String(paramId || "").trim();
  if (!bucketId) {
    try {
      const me = await auth.me();
      bucketId = me?.bucketId || "";
    } catch {}
  }
  return bucketId;
}

async function budgetAccessory({ bucketId: paramId } = {}) {
  const bucketId = await resolveBucketId(paramId);
  if (!bucketId) return { bucketId: "", bucket: null, budget: null, bucketBudgets: [] };
  const buckets = await endpoints.buckets({ page: 1, pageSize: 20 });
  const bucket = buckets.find((b) => b && b._id === bucketId) || null;
  if (!bucket) return { bucketId, bucket: null, budget: null, bucketBudgets: [] };
  const allBudgets = await endpoints.budgets({ bucketId });
  const bucketBudgets = allBudgets.filter((b) => b.categoryId === null);
  if (!bucketBudgets.length) return { bucketId, bucket, budget: null, bucketBudgets };
  const pick =
    bucketBudgets.find((b) => b.period === "monthly") ||
    bucketBudgets.find((b) => b.period === "yearly") ||
    bucketBudgets.find((b) => b.period === "weekly") ||
    bucketBudgets[0];
  return { bucketId, bucket, budget: pick, bucketBudgets };
}

async function budgetsWidget({ bucketId: paramId } = {}) {
  const bucketId = await resolveBucketId(paramId);
  if (!bucketId) return { bucketId: "", bucket: null, bucketBudgets: [], categoryBudgets: [] };
  const buckets = await endpoints.buckets({ page: 1, pageSize: 20 });
  const bucket = buckets.find((b) => b && b._id === bucketId) || null;
  if (!bucket) return { bucketId, bucket: null, bucketBudgets: [], categoryBudgets: [] };
  const inBucket = await endpoints.budgets({ bucketId });
  const bucketBudgets = inBucket.filter((b) => b.categoryId === null);
  const categoryBudgets = inBucket
    .filter((b) => b.categoryId !== null)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);
  return { bucketId, bucket, bucketName: bucket.name || "Bucket", bucketBudgets, categoryBudgets };
}

async function categoryMonth({ bucketId: paramId } = {}) {
  const bucketId = await resolveBucketId(paramId);
  if (!bucketId) return { bucketId: "", bucket: null, categories: [], totalSpend: 0 };
  const buckets = await endpoints.buckets({ page: 1, pageSize: 20 });
  const bucket = buckets.find((b) => b && b._id === bucketId) || null;
  if (!bucket) return { bucketId, bucket: null, categories: [], totalSpend: 0 };
  const categories = await endpoints.categoriesWithStats({ bucketId });
  const totalSpend = categories.reduce((sum, c) => sum + (c.total || 0), 0);
  return { bucketId, bucket, bucketName: bucket.name || "Bucket", categories, totalSpend };
}

async function monthOverview({ bucketId: paramId } = {}) {
  const bucketId = await resolveBucketId(paramId);
  if (!bucketId) return { bucketId: "", bucket: null, expenses: [], total: 0, totalSpend: 0 };
  const buckets = await endpoints.buckets({ page: 1, pageSize: 20 });
  const bucket = buckets.find((b) => b && b._id === bucketId) || null;
  if (!bucket) return { bucketId, bucket: null, expenses: [], total: 0, totalSpend: 0 };
  const { items, total } = await endpoints.expenses({ bucketId, page: 1, pageSize: 50 });
  const totalSpend = items.reduce((sum, e) => sum + (e.amount || 0), 0);
  return {
    bucketId,
    bucket,
    bucketName: bucket.name || "Bucket",
    expenses: items,
    total,
    totalSpend,
  };
}

async function overviewAccessory({ bucketId: paramId } = {}) {
  const bucketId = await resolveBucketId(paramId);
  // overview gracefully handles undefined bucketId (PERSONAL fallback); keep consistent
  const { totalSpend, perDay } = await endpoints.overview({
    bucketId: bucketId || undefined,
  });
  return { bucketId, totalSpend, perDay };
}
