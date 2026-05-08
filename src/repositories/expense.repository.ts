import { Types } from 'mongoose';

import { ExpenseModel } from '@/models/Expense';

type ExpenseFilters = {
  q?: string;
  categoryId?: string;
  sortBy: 'dateTime' | 'amount' | 'title';
  order: 'asc' | 'desc';
  page: number;
  limit: number;
};

export async function createExpense(data: {
  userId: string;
  title: string;
  amount: number;
  categoryId: string;
  images: string[];
  location: { latitude: number; longitude: number; address?: string };
  currency: string;
  dateTime: Date;
}) {
  const expense = await ExpenseModel.create(data);
  return expense.toObject();
}

export async function listExpenses(userId: string, filters: ExpenseFilters) {
  const query: Record<string, unknown> = { userId };

  if (filters.q) {
    query.$text = { $search: filters.q };
  }

  if (filters.categoryId && Types.ObjectId.isValid(filters.categoryId)) {
    query.categoryId = filters.categoryId;
  }

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    ExpenseModel.find(query)
      .sort({ [filters.sortBy]: filters.order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(filters.limit)
      .lean(),
    ExpenseModel.countDocuments(query),
  ]);

  return {
    items,
    total,
    page: filters.page,
    totalPages: Math.ceil(total / filters.limit) || 1,
  };
}

export async function updateExpense(userId: string, expenseId: string, data: Record<string, unknown>) {
  if (!Types.ObjectId.isValid(expenseId)) {
    return null;
  }

  return ExpenseModel.findOneAndUpdate({ _id: expenseId, userId }, data, { new: true, lean: true });
}

export async function deleteExpense(userId: string, expenseId: string) {
  if (!Types.ObjectId.isValid(expenseId)) {
    return null;
  }

  return ExpenseModel.findOneAndDelete({ _id: expenseId, userId }).lean();
}

export async function listRecentExpenses(userId: string, limit = 5) {
  return ExpenseModel.find({ userId }).sort({ dateTime: -1 }).limit(limit).lean();
}

export async function listExpensesForRange(userId: string, from: Date, to: Date) {
  return ExpenseModel.find({
    userId,
    dateTime: { $gte: from, $lte: to },
  }).lean();
}
