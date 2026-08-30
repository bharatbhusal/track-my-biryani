import { Types } from "mongoose";

import { BudgetModel } from "@/models/Budget";

export async function createBudget(data: {
  bucketId: Types.ObjectId;
  categoryId: Types.ObjectId | null;
  ownerId: Types.ObjectId;
  amount: number;
  period: string;
}) {
  const budget = await BudgetModel.create(data);
  return budget.toObject();
}

export async function findBudgetById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return BudgetModel.findById(id).lean();
}

export async function listBudgetsForBuckets(bucketIds: Types.ObjectId[]) {
  return BudgetModel.find({ bucketId: { $in: bucketIds } }).lean();
}

export async function updateBudget(id: string, data: Record<string, unknown>) {
  if (!Types.ObjectId.isValid(id)) return null;
  return BudgetModel.findByIdAndUpdate(id, data, { new: true, lean: true });
}

export async function deleteBudget(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return BudgetModel.findByIdAndDelete(id).lean();
}

export async function findExisting(
  bucketId: Types.ObjectId,
  period: string,
  categoryId: Types.ObjectId | null,
) {
  return BudgetModel.findOne({ bucketId, period, categoryId }).lean();
}
