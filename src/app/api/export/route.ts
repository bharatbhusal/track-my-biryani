import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import {
	getBucketId,
	resolveBucketContext,
} from "@/lib/bucket";
import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { buildTimestampedFilename } from "@/lib/naming";
import { listCategories } from "@/repositories/category.repository";
import {
	listExpenses,
	listExpensesForRange,
} from "@/repositories/expense.repository";

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
		const bucketId = getBucketId(request);
		const ctx = await resolveBucketContext(
			auth.userId,
			bucketId,
		);
		const type = request.nextUrl.searchParams.get("type");
		const now = new Date();
		const monthStart = new Date(
			now.getFullYear(),
			now.getMonth(),
			1,
		);

		const [categories, expenses, monthlyExpenses] =
			await Promise.all([
				listCategories(ctx.bucketId),
				listExpenses(
					auth.userId,
					{
						page: 1,
						limit: 5000,
						sortBy: "paidAt",
						order: "desc",
					},
					ctx.bucketId,
				),
				listExpensesForRange(
					auth.userId,
					monthStart,
					now,
					ctx.bucketId,
				),
			]);

		const exportedAt = new Date().toISOString();
		const analytics = {
			totalMonthlySpend: monthlyExpenses.reduce(
				(sum, item) => sum + item.amount,
				0,
			),
			expenseCount: expenses.total,
			categoryCount: categories.length,
			exportGeneratedAt: exportedAt,
		};

		const normalizedPayload: ExportPayload = {
			exportedAt,
			analytics,
			categories: categories.map((category) => ({
				id: category._id.toString(),
				name: category.name,
				color: category.color,
				createdAt: category.createdAt,
			})),
			expenses: expenses.items.map((expense) => ({
				id: expense._id.toString(),
				title: expense.title,
				amount: expense.amount,
				categoryId: expense.categoryId.toString(),
				categoryName:
					categories.find(
						(category) =>
							category._id.toString() ===
							expense.categoryId.toString(),
					)?.name ?? "Unknown",
				images: expense.images,
				location: expense.location,
				currency: expense.currency,
				paidAt: expense.paidAt,
				createdAt: expense.createdAt,
			})),
		};

		let payload:
			| ExportPayload
			| Pick<ExportPayload, "expenses">
			| Pick<ExportPayload, "categories"> = normalizedPayload;

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
