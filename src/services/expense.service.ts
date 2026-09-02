import { Types } from "mongoose";

import { AppError } from "@/lib/errors";
import {
  chartOverviewSchema,
  distributionSchema,
  expenseSchema,
  expenseSearchSchema,
} from "@/lib/validators";
import { toIsoBoundsForPreset } from "@/lib/date-range";
import { buildExpenseQuery } from "@/lib/query-builders";
import { getValidBuckets } from "@/lib/query-builders/membership";
import {
  createExpense,
  deleteExpense,
  getDistribution,
  getExpenseByIdForMember,
  getExpenseContribution,
  getExpenseOverviewStats,
  getChartData,
  searchExpenses,
  updateExpense,
} from "@/repositories/expense.repository";
import { ensureCategoryInBucket, getCategoryById } from "@/repositories/category.repository";
import { findBucketById } from "@/repositories/bucket.repository";
import { findUserById } from "@/repositories/user.repository";
import { logAuditEvent } from "@/services/audit.service";
import type { ExpenseSearchRequest } from "@/constants/types/search.types";
import { AUDIT_ACTIONS } from "@/constants/types/audit.types";

export async function createExpenseService(userId: string, body: unknown) {
  const payload = expenseSchema.parse(body);

  const validBuckets = await getValidBuckets(userId);
  if (!validBuckets.map((id) => id.toString()).includes(payload.bucketId)) {
    throw new AppError("Not a member of this bucket", 403, "NOT_A_MEMBER");
  }

  const existing = await findUserById(userId);
  if (!existing) {
    throw new AppError("User doesn't exist", 409, "USER_DOESN'T_EXIST");
  }

  const category = await getCategoryById(payload.categoryId, payload.bucketId);
  if (!category) {
    throw new AppError("Category does not belong to this bucket", 400, "CATEGORY_NOT_IN_BUCKET");
  }

  const expense = await createExpense({
    userId,
    bucketId: payload.bucketId,
    title: payload.title,
    amount: payload.amount,
    categoryId: payload.categoryId,
    notes: payload.notes,
    images: payload.images,
    location: payload.location,
    currency: payload.currency,
    paidAt: payload?.paidAt ? new Date(payload.paidAt) : undefined,
  });

  await logAuditEvent({
    actorId: userId,
    bucketId: payload.bucketId,
    action: AUDIT_ACTIONS.CREATE,
    entity: "expense",
    entityId: expense._id.toString(),
    note: `Created expense "${expense.title}"`,
    metadata: { amount: expense.amount },
  });

  return expense;
}

export async function getExpenseService(userId: string, expenseId: string) {
  const validBuckets = await getValidBuckets(userId);
  const expense = await getExpenseByIdForMember(expenseId, validBuckets);
  if (!expense) {
    throw new AppError("Expense not found", 404, "NOT_FOUND");
  }
  return expense;
}

export async function updateExpenseService(userId: string, expenseId: string, body: unknown) {
  const payload = expenseSchema.partial().parse(body);

  const validBuckets = await getValidBuckets(userId);
  const current = await getExpenseByIdForMember(expenseId, validBuckets);
  if (!current) {
    throw new AppError("Expense not found", 404, "NOT_FOUND");
  }
  if (current.userId.toString() !== userId) {
    throw new AppError("Only the owner can update this expense", 403, "NOT_OWNER");
  }

  const targetBucketId = payload.bucketId ? String(payload.bucketId) : current.bucketId.toString();

  if (payload.bucketId && !validBuckets.map((id) => id.toString()).includes(targetBucketId)) {
    throw new AppError("Not a member of this bucket", 403, "NOT_A_MEMBER");
  }

  let categoryId: string;
  if (payload.categoryId) {
    const category = await getCategoryById(payload.categoryId, targetBucketId);
    if (!category) {
      throw new AppError("Category does not belong to this bucket", 400, "CATEGORY_NOT_IN_BUCKET");
    }
    categoryId = category._id.toString();
  } else if (targetBucketId === current.bucketId.toString()) {
    categoryId = current.categoryId;
  } else {
    const sourceCategory = await getCategoryById(current.categoryId, current.bucketId.toString());
    if (!sourceCategory) {
      throw new AppError("Source category not found", 400, "CATEGORY_NOT_IN_BUCKET");
    }
    const destCategory = await ensureCategoryInBucket(userId, targetBucketId, {
      name: sourceCategory.name,
      color: sourceCategory.color,
      emoji: sourceCategory.emoji,
    });
    categoryId = destCategory._id.toString();
  }

  const expense = await updateExpense(userId, expenseId, {
    ...payload,
    categoryId,
    bucketId: targetBucketId,
  });
  if (!expense) {
    throw new AppError("Expense not found", 404, "NOT_FOUND");
  }

  if (payload.bucketId && payload.bucketId !== current.bucketId.toString()) {
    const sourceId = current.bucketId.toString();
    const destId = targetBucketId;
    const sourceName = (await findBucketById(sourceId))?.name ?? sourceId;
    const destName = (await findBucketById(destId))?.name ?? destId;
    await logAuditEvent({
      actorId: userId,
      bucketId: sourceId,
      action: AUDIT_ACTIONS.OUT,
      entity: "expense",
      entityId: expenseId,
      note: `Moved expense "${expense.title}" to ${destName}`,
    });
    await logAuditEvent({
      actorId: userId,
      bucketId: destId,
      action: AUDIT_ACTIONS.IN,
      entity: "expense",
      entityId: expenseId,
      note: `Expense "${expense.title}" moved from ${sourceName}`,
    });
  } else {
    await logAuditEvent({
      actorId: userId,
      bucketId: current.bucketId.toString(),
      action: AUDIT_ACTIONS.UPDATE,
      entity: "expense",
      entityId: expenseId,
      note: `Updated expense "${expense.title}"`,
    });
  }

  return expense;
}

export async function deleteExpenseService(userId: string, expenseId: string) {
  const validBuckets = await getValidBuckets(userId);
  const existing = await getExpenseByIdForMember(expenseId, validBuckets);
  if (!existing) {
    throw new AppError("Expense not found", 404, "NOT_FOUND");
  }
  if (existing.userId.toString() !== userId) {
    throw new AppError("Only the owner can delete this expense", 403, "NOT_OWNER");
  }
  const deleted = await deleteExpense(userId, expenseId);
  if (!deleted) {
    throw new AppError("Expense not found", 404, "NOT_FOUND");
  }

  await logAuditEvent({
    actorId: userId,
    bucketId: existing.bucketId.toString(),
    action: AUDIT_ACTIONS.DELETE,
    entity: "expense",
    entityId: expenseId,
    note: `Deleted expense "${deleted.title}"`,
  });

  return { message: "Expense deleted" };
}

export async function getContributionService(
  userId: string,
  expenseId: string,
  from?: string,
  to?: string,
) {
  const validBuckets = await getValidBuckets(userId);
  const existing = await getExpenseByIdForMember(expenseId, validBuckets);
  if (!existing) {
    throw new AppError("Expense not found", 404, "NOT_FOUND");
  }
  const data = await getExpenseContribution(
    expenseId,
    existing.bucketId as unknown as Types.ObjectId,
    from ? new Date(from) : undefined,
    to ? new Date(to) : undefined,
  );
  if (!data) {
    throw new AppError("Expense not found", 404, "NOT_FOUND");
  }
  return data;
}

// ponytail: overview/chart share the same parse + query-build step; both
// aggregate on the full filter criteria (bucket/category/owner/date/search/…)
// so the cards and chart always match what the table shows.
async function chartOverviewContext(
  userId: string,
  body: unknown,
): Promise<{
  match: Record<string, unknown>;
  from: Date;
  to: Date;
}> {
  const parsed = chartOverviewSchema.parse(body ?? {});
  const filters = parsed.filterCriteria ?? defaultExpenseSearchRequest().filterCriteria;

  const { query } = await buildExpenseQuery(userId, {
    filterCriteria: filters,
    sortCriteria: { field: "paidAt", direction: "DESC" },
    pagination: { page: 1, pageSize: 1 },
  });

  const bounds = toIsoBoundsForPreset(filters.datePreset, filters.customFrom, filters.customTo);
  return {
    match: query,
    from: bounds?.from ? new Date(bounds.from) : new Date(0),
    to: bounds?.to ? new Date(bounds.to) : new Date(),
  };
}

export async function getExpenseOverviewStatsService(userId: string, body: unknown) {
  const { match, from, to } = await chartOverviewContext(userId, body);
  const { total, count, avg, min, max, categoriesCount } = await getExpenseOverviewStats(match);

  const dayDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

  let periodCount: number;
  let perPeriodLabel: string;
  if (dayDiff <= 60) {
    periodCount = Math.max(1, dayDiff);
    perPeriodLabel = "spend_per_day";
  } else {
    periodCount =
      to.getMonth() - from.getMonth() + 1 + (to.getFullYear() - from.getFullYear()) * 12;
    perPeriodLabel = "spend_per_month";
  }

  const averageSpend = periodCount > 0 ? total / periodCount : total;

  const cards = [
    {
      key: perPeriodLabel,
      title: perPeriodLabel === "spend_per_month" ? "Per Month Spend" : "Per Day Spend",
      value: averageSpend,
    },
    {
      key: "expense_count",
      title: "Expenses",
      value: count,
    },
    {
      key: "categories_count",
      title: "Categories",
      value: categoriesCount,
    },
    {
      key: "avg_amount",
      title: "Average",
      value: avg,
    },
    {
      key: "min_amount",
      title: "Minimum",
      value: min,
    },
    {
      key: "max_amount",
      title: "Maximum",
      value: max,
    },
    {
      key: "total_spend",
      title: "Total Spend",
      value: total,
    },
  ];

  return cards;
}

export async function getChartDataService(userId: string, body: unknown) {
  const { match, from, to } = await chartOverviewContext(userId, body);
  return getChartData(match, from, to);
}

function defaultExpenseSearchRequest(): ExpenseSearchRequest {
  return {
    filterCriteria: {
      bucketPreset: "PERSONAL",
      bucketIds: [],
      categoryPreset: "ALL",
      categoryIds: [],
      ownerPreset: "ME",
      ownerIds: [],
      datePreset: "THIS_MONTH",
    },
    sortCriteria: { field: "paidAt", direction: "DESC" },
    pagination: { page: 1, pageSize: 20 },
  };
}

export async function searchExpensesService(userId: string, searchRequest: unknown) {
  const parsed = expenseSearchSchema.parse(searchRequest ?? {});
  const request: ExpenseSearchRequest = {
    filterCriteria: parsed.filterCriteria ?? defaultExpenseSearchRequest().filterCriteria,
    sortCriteria: parsed.sortCriteria ?? defaultExpenseSearchRequest().sortCriteria,
    pagination: parsed.pagination ?? defaultExpenseSearchRequest().pagination,
  };
  return searchExpenses(userId, request);
}

// Distributions intentionally apply only the date range plus membership scope:
// the UI shows the whole picture and highlights the current selection, so the
// data must not be pre-narrowed by bucket/category/owner/q/hasNotes/hasLocation.
export async function getDistributionService(userId: string, body: unknown) {
  const parsed = distributionSchema.parse(body ?? {});
  const filters = parsed.filterCriteria ?? defaultExpenseSearchRequest().filterCriteria;

  const bucketIds = await getValidBuckets(userId);
  const bounds = toIsoBoundsForPreset(filters.datePreset, filters.customFrom, filters.customTo);

  return getDistribution(
    bucketIds,
    parsed.dimension,
    bounds?.from ? new Date(bounds.from) : undefined,
    bounds?.to ? new Date(bounds.to) : undefined,
  );
}
