import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { buildTimestampedFilename } from "@/lib/naming";
import { getValidBuckets } from "@/lib/query-builders/membership";
import { CategoryModel } from "@/models/Category";
import { ExpenseModel } from "@/models/Expense";

type ExportPayload = {
  exportedAt: string;
  analytics: {
    totalMonthlySpend: number;
    expenseCount: number;
    categoryCount: number;
    exportGeneratedAt: string;
  };
  categories: Array<{
    id: string;
    name: string;
    color: string;
    createdAt?: string;
  }>;
  expenses: Array<{
    id: string;
    title: string;
    amount: number;
    categoryId: string;
    categoryName: string;
    images: string[];
    location: unknown;
    currency: string;
    paidAt: string;
    createdAt?: string;
  }>;
};

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const auth = await getAuthPayload();
    const validBuckets = await getValidBuckets(auth.id);
    const type = request.nextUrl.searchParams.get("type");
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [categories, expenses, monthlyExpenses] = await Promise.all([
      CategoryModel.find({ bucketId: { $in: validBuckets } })
        .sort({ createdAt: -1 })
        .lean(),
      ExpenseModel.find({ bucketId: { $in: validBuckets } })
        .sort({ paidAt: -1 })
        .limit(5000)
        .lean(),
      ExpenseModel.find({
        bucketId: { $in: validBuckets },
        paidAt: { $gte: monthStart, $lte: now },
      }).lean(),
    ]);

    const exportedAt = new Date().toISOString();
    const analytics = {
      totalMonthlySpend: monthlyExpenses.reduce((sum, item) => sum + item.amount, 0),
      expenseCount: expenses.length,
      categoryCount: categories.length,
      exportGeneratedAt: exportedAt,
    };

    const normalizedPayload: ExportPayload = {
      exportedAt,
      analytics,
      categories: categories.map((category) => ({
        id: (category._id as { toString(): string }).toString(),
        name: category.name,
        color: category.color,
        createdAt: (category as { createdAt?: Date }).createdAt?.toISOString(),
      })),
      expenses: expenses.map((expense) => ({
        id: (expense._id as { toString(): string }).toString(),
        title: expense.title,
        amount: expense.amount,
        categoryId: (expense.categoryId as { toString(): string }).toString(),
        categoryName:
          categories.find(
            (category) =>
              (category._id as { toString(): string }).toString() ===
              (expense.categoryId as { toString(): string }).toString(),
          )?.name ?? "Unknown",
        images: expense.images,
        location: expense.location,
        currency: expense.currency,
        paidAt: (expense.paidAt as Date).toISOString(),
        createdAt: (expense as { createdAt?: Date }).createdAt?.toISOString(),
      })),
    };

    let payload:
      ExportPayload | Pick<ExportPayload, "expenses"> | Pick<ExportPayload, "categories"> =
      normalizedPayload;

    if (!type || type === "all") {
      payload = normalizedPayload;
    } else if (type === "expenses") {
      payload = { expenses: normalizedPayload.expenses };
    } else if (type === "categories") {
      payload = { categories: normalizedPayload.categories };
    }

    return successResponse({
      data: JSON.stringify(payload, null, 2),
      filename: buildTimestampedFilename({
        baseName: `expense_report${type ? `_${type}` : ""}`,
        extension: "json",
      }),
      mimeType: "application/json;charset=utf-8",
      exportedAt,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
