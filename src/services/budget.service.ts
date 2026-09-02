import { Types } from "mongoose";

import { AppError } from "@/lib/errors";
import { boundsForBudgetPeriod } from "@/lib/date-range";
import { budgetSchema, budgetUpdateSchema } from "@/lib/validators";
import { getValidBuckets } from "@/lib/query-builders/membership";
import { ExpenseModel } from "@/models/Expense";
import { BucketModel } from "@/models/Bucket";
import { CategoryModel } from "@/models/Category";
import {
  createBudget,
  deleteBudget,
  findBudgetById,
  listBudgetsForBuckets,
  updateBudget,
} from "@/repositories/budget.repository";
import { ensureCategoryInBucket, getCategoryById } from "@/repositories/category.repository";
import { logAuditEvent } from "@/services/audit.service";
import type { BudgetGroup, BudgetItem, BudgetPeriod } from "@/constants/types/budget.types";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/constants/types/audit.types";

function toBudgetItem(
  b: Record<string, unknown>,
  bucketMap: Map<string, { name: string; icon?: string; isPersonal?: boolean }>,
  categoryMap: Map<string, { name: string; color: string; emoji?: string }>,
  spentMap: Map<string, number>,
): BudgetItem {
  const id = (b._id as Types.ObjectId).toString();
  const bucketId = (b.bucketId as Types.ObjectId).toString();
  const categoryId = b.categoryId ? (b.categoryId as Types.ObjectId).toString() : null;
  const bucket = bucketMap.get(bucketId);
  const cat = categoryId ? categoryMap.get(categoryId) : undefined;
  const amount = b.amount as number;
  const spent = spentMap.get(id) ?? 0;
  const pct = amount > 0 ? Math.round((spent / amount) * 100) : 0;
  return {
    _id: id,
    bucketId,
    bucketName: bucket?.name,
    bucketIcon: bucket?.icon,
    bucketIsPersonal: bucket?.isPersonal,
    categoryId,
    categoryName: cat?.name,
    categoryColor: cat?.color,
    categoryEmoji: cat?.emoji,
    ownerId: (b.ownerId as Types.ObjectId).toString(),
    amount,
    period: b.period as BudgetPeriod,
    spent,
    remaining: Math.max(0, amount - spent),
    pct,
    createdAt: (b.createdAt as Date | undefined)?.toISOString(),
    updatedAt: (b.updatedAt as Date | undefined)?.toISOString(),
  };
}

async function buildGroups(userId: string): Promise<BudgetGroup[]> {
  const validBuckets = await getValidBuckets(userId);
  if (validBuckets.length === 0) return [];
  const budgets = await listBudgetsForBuckets(validBuckets);
  if (budgets.length === 0) return [];

  const bucketIds = [...new Set(budgets.map((b) => b.bucketId.toString()))];
  const categoryIds = budgets
    .map((b) => b.categoryId)
    .filter((id): id is Types.ObjectId => !!id)
    .map((id) => id.toString());

  const [buckets, categories] = await Promise.all([
    BucketModel.find({ _id: { $in: bucketIds } })
      .select("name icon isPersonal")
      .lean(),
    categoryIds.length
      ? CategoryModel.find({ _id: { $in: categoryIds } })
          .select("name color emoji")
          .lean()
      : Promise.resolve(
          [] as unknown as typeof CategoryModel extends { find: (...args: unknown[]) => unknown }
            ? never
            : never,
        ),
  ]);

  const bucketMap = new Map(
    buckets.map((b) => [
      (b._id as Types.ObjectId).toString(),
      {
        name: b.name as string,
        icon: b.icon as string | undefined,
        isPersonal: b.isPersonal as boolean | undefined,
      },
    ]),
  );
  const categoryMap = new Map(
    (categories as { _id: Types.ObjectId; name: string; color: string; emoji?: string }[]).map(
      (c) => [c._id.toString(), { name: c.name, color: c.color, emoji: c.emoji }],
    ),
  );

  // spent per budget = sum expenses in this period for bucket (+ category)
  const spentMap = new Map<string, number>();
  await Promise.all(
    budgets.map(async (b) => {
      const period = b.period as BudgetPeriod;
      const { from, to } = boundsForBudgetPeriod(period);
      const match: Record<string, unknown> = {
        bucketId: b.bucketId,
        paidAt: { $gte: from, $lte: to },
      };
      if (b.categoryId) match.categoryId = b.categoryId;
      const agg = await ExpenseModel.aggregate<{ total: number }>([
        { $match: match },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      spentMap.set((b._id as Types.ObjectId).toString(), agg[0]?.total ?? 0);
    }),
  );

  const items = budgets.map((b) =>
    toBudgetItem(b as unknown as Record<string, unknown>, bucketMap, categoryMap, spentMap),
  );

  // group by bucket
  const byBucket = new Map<string, BudgetItem[]>();
  for (const it of items) {
    if (!byBucket.has(it.bucketId)) byBucket.set(it.bucketId, []);
    byBucket.get(it.bucketId)!.push(it);
  }

  const groups: BudgetGroup[] = [];
  for (const [bucketId, budgets] of byBucket) {
    const meta = bucketMap.get(bucketId);
    groups.push({
      bucketId,
      bucketName: meta?.name ?? "Unknown",
      bucketIcon: meta?.icon,
      isPersonal: meta?.isPersonal,
      budgets,
    });
  }

  // personal first, then alphabetical
  groups.sort((a, b) => {
    if (a.isPersonal && !b.isPersonal) return -1;
    if (!a.isPersonal && b.isPersonal) return 1;
    return a.bucketName.localeCompare(b.bucketName);
  });

  return groups;
}

export async function listBudgetsService(userId: string): Promise<BudgetGroup[]> {
  return buildGroups(userId);
}

export async function createBudgetService(userId: string, body: unknown): Promise<BudgetItem> {
  const payload = budgetSchema.parse(body);
  const validBuckets = await getValidBuckets(userId);
  const validSet = new Set(validBuckets.map((id) => id.toString()));
  if (!validSet.has(payload.bucketId)) {
    throw new AppError("Not a member of this bucket", 403, "NOT_A_MEMBER");
  }

  let categoryId: Types.ObjectId | null = null;
  if (payload.categoryId) {
    const cat = await getCategoryById(payload.categoryId, payload.bucketId);
    if (!cat)
      throw new AppError("Category does not belong to this bucket", 400, "CATEGORY_NOT_IN_BUCKET");
    categoryId = new Types.ObjectId(payload.categoryId);
  }

  const bucket = await BucketModel.findById(payload.bucketId).lean();
  try {
    const created = await createBudget({
      bucketId: new Types.ObjectId(payload.bucketId),
      categoryId,
      ownerId: new Types.ObjectId(userId),
      amount: payload.amount,
      period: payload.period,
    });

    await logAuditEvent({
      actorId: userId,
      bucketId: payload.bucketId,
      action: AUDIT_ACTIONS.CREATE,
      entity: AUDIT_ENTITIES.BUDGET,
      entityId: created._id.toString(),
      note: `Created ${payload.period} budget of ${payload.amount} for ${categoryId ? "category" : "bucket"} ${bucket?.name ?? payload.bucketId}`,
      metadata: {
        amount: payload.amount,
        period: payload.period,
        categoryId: categoryId?.toString() ?? null,
      },
    });

    // build single item with spent
    const groups = await buildGroups(userId);
    const found = groups.flatMap((g) => g.budgets).find((b) => b._id === created._id.toString());
    if (found) return found;
    return {
      _id: created._id.toString(),
      bucketId: payload.bucketId,
      bucketName: bucket?.name as string | undefined,
      bucketIcon: bucket?.icon as string | undefined,
      categoryId: categoryId?.toString() ?? null,
      ownerId: userId,
      amount: payload.amount,
      period: payload.period as BudgetPeriod,
      spent: 0,
      remaining: payload.amount,
      pct: 0,
    };
  } catch (e: unknown) {
    if ((e as { code?: number }).code === 11000) {
      throw new AppError(
        "Budget already exists for this bucket/category/period",
        409,
        "ALREADY_EXISTS",
      );
    }
    throw e;
  }
}

export async function updateBudgetService(
  userId: string,
  budgetId: string,
  body: unknown,
): Promise<BudgetItem> {
  const payload = budgetUpdateSchema.parse(body);
  const current = await findBudgetById(budgetId);
  if (!current) throw new AppError("Budget not found", 404, "NOT_FOUND");
  if (current.ownerId.toString() !== userId) {
    throw new AppError("Only the owner can edit this budget", 403, "NOT_OWNER");
  }

  const targetBucketId = payload.bucketId ?? current.bucketId.toString();
  const validBuckets = await getValidBuckets(userId);
  if (!validBuckets.map((id) => id.toString()).includes(targetBucketId)) {
    throw new AppError("Not a member of this bucket", 403, "NOT_A_MEMBER");
  }

  let nextCategoryId: Types.ObjectId | null | undefined;
  const nextAmount = payload.amount ?? (current.amount as number);
  const nextPeriod = payload.period ?? (current.period as string);

  // handle category resolution like expense move
  if (payload.categoryId !== undefined) {
    if (payload.categoryId === null) {
      nextCategoryId = null;
    } else {
      const cat = await getCategoryById(payload.categoryId, targetBucketId);
      if (!cat)
        throw new AppError(
          "Category does not belong to this bucket",
          400,
          "CATEGORY_NOT_IN_BUCKET",
        );
      nextCategoryId = new Types.ObjectId(payload.categoryId);
    }
  } else if (payload.bucketId && payload.bucketId !== current.bucketId.toString()) {
    // bucket changed but category not specified -> carry over or ensure
    if (current.categoryId) {
      const sourceCat = await getCategoryById(
        current.categoryId.toString(),
        current.bucketId.toString(),
      );
      if (sourceCat) {
        const destCat = await ensureCategoryInBucket(userId, targetBucketId, {
          name: sourceCat.name,
          color: sourceCat.color,
          emoji: sourceCat.emoji,
        });
        nextCategoryId = destCat._id as Types.ObjectId;
      } else {
        nextCategoryId = null;
      }
    } else {
      nextCategoryId = null;
    }
  }

  const update: Record<string, unknown> = {};
  if (payload.bucketId) update.bucketId = new Types.ObjectId(targetBucketId);
  if (nextCategoryId !== undefined) update.categoryId = nextCategoryId;
  if (payload.amount !== undefined) update.amount = nextAmount;
  if (payload.period !== undefined) update.period = nextPeriod;

  if (Object.keys(update).length === 0) {
    // no change, return current as BudgetItem
    const groups = await buildGroups(userId);
    const found = groups.flatMap((g) => g.budgets).find((b) => b._id === budgetId);
    if (found) return found;
    throw new AppError("Budget not found", 404, "NOT_FOUND");
  }

  try {
    const updated = await updateBudget(budgetId, update);
    if (!updated) throw new AppError("Budget not found", 404, "NOT_FOUND");

    const isMove = payload?.bucketId !== current.bucketId.toString();
    if (isMove) {
      const sourceName =
        (await BucketModel.findById(current.bucketId).lean())?.name ?? current.bucketId.toString();
      const destName = (await BucketModel.findById(targetBucketId).lean())?.name ?? targetBucketId;
      await logAuditEvent({
        actorId: userId,
        bucketId: current.bucketId.toString(),
        action: AUDIT_ACTIONS.OUT,
        entity: AUDIT_ENTITIES.BUDGET,
        entityId: budgetId,
        note: `Moved a budget to ${destName}`,
      });
      await logAuditEvent({
        actorId: userId,
        bucketId: targetBucketId,
        action: AUDIT_ACTIONS.IN,
        entity: AUDIT_ENTITIES.BUDGET,
        entityId: budgetId,
        note: `A budget moved from ${sourceName}`,
        metadata: { amount: nextAmount, period: nextPeriod },
      });
    } else {
      await logAuditEvent({
        actorId: userId,
        bucketId: targetBucketId,
        action: AUDIT_ACTIONS.UPDATE,
        entity: AUDIT_ENTITIES.BUDGET,
        entityId: budgetId,
        metadata: {
          amount: nextAmount,
          period: nextPeriod,
          categoryId:
            nextCategoryId !== undefined ? (nextCategoryId?.toString() ?? null) : undefined,
        },
      });
    }

    const groups = await buildGroups(userId);
    const found = groups.flatMap((g) => g.budgets).find((b) => b._id === budgetId);
    if (found) return found;
    // fallback
    return {
      _id: budgetId,
      bucketId: targetBucketId,
      categoryId:
        nextCategoryId !== undefined
          ? (nextCategoryId?.toString() ?? null)
          : (current.categoryId?.toString() ?? null),
      ownerId: userId,
      amount: nextAmount,
      period: nextPeriod as BudgetPeriod,
      spent: 0,
      remaining: nextAmount,
      pct: 0,
    };
  } catch (e: unknown) {
    if ((e as { code?: number }).code === 11000) {
      throw new AppError(
        "Budget already exists for this bucket/category/period",
        409,
        "ALREADY_EXISTS",
      );
    }
    throw e;
  }
}

export async function deleteBudgetService(userId: string, budgetId: string) {
  const current = await findBudgetById(budgetId);
  if (!current) throw new AppError("Budget not found", 404, "NOT_FOUND");
  if (current.ownerId.toString() !== userId) {
    throw new AppError("Only the owner can delete this budget", 403, "NOT_OWNER");
  }
  await deleteBudget(budgetId);

  await logAuditEvent({
    actorId: userId,
    bucketId: current.bucketId.toString(),
    action: AUDIT_ACTIONS.DELETE,
    entity: AUDIT_ENTITIES.BUDGET,
    entityId: budgetId,
    note: `Deleted budget ${budgetId}`,
  });

  return { message: "Budget deleted" };
}
