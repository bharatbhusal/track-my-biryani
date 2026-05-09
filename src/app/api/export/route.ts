import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { buildTimestampedFilename } from "@/lib/naming";
import { listAuditLogs } from "@/repositories/audit.repository";
import { listCategories } from "@/repositories/category.repository";
import {
	listExpenses,
	listExpensesForRange,
} from "@/repositories/expense.repository";

type ExportFormat = "json" | "csv";

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
		dateTime: string;
		createdAt?: string;
	}>;
	activityLogs: Array<{
		id: string;
		action: string;
		entityType: string;
		entityId?: string;
		timestamp: string;
	}>;
};

function asCsvValue(value: unknown): string {
	const raw = String(value ?? "").replace(/[\n\r\t]/g, " ");
	return `"${raw.replaceAll('"', '""')}"`;
}

function buildCsv(rows: string[][]): string {
	return rows
		.map((row) => row.map(asCsvValue).join(","))
		.join("\n");
}

function addSection(
	rows: string[][],
	title: string,
	headers: string[],
	data: Array<Array<unknown>>,
): void {
	rows.push([title]);
	rows.push(headers);
	data.forEach((item) =>
		rows.push(item.map((value) => String(value ?? ""))),
	);
	rows.push([]);
}

export async function GET(request: NextRequest) {
	try {
		await connectToDatabase();
		const auth = await getAuthPayload();
		const format = "json" as ExportFormat;
		const type = request.nextUrl.searchParams.get("type");
		const now = new Date();
		const monthStart = new Date(
			now.getFullYear(),
			now.getMonth(),
			1,
		);

		const [categories, expenses, logs, monthlyExpenses] =
			await Promise.all([
				listCategories(auth.userId),
				listExpenses(auth.userId, {
					page: 1,
					limit: 5000,
					sortBy: "dateTime",
					order: "desc",
				}),
				listAuditLogs(auth.userId, 1, 5000),
				listExpensesForRange(auth.userId, monthStart, now),
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

		const normalizedPayload = {
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
				dateTime: expense.dateTime,
				createdAt: expense.createdAt,
			})),
			activityLogs: logs.items.map((log) => ({
				id: log._id.toString(),
				action: log.action,
				entityType: log.entityType,
				entityId: log.entityId,
				timestamp: log.timestamp,
			})),
		};

		// Only JSON export is supported. Allow exporting specific sections via `type` query param.
		let payload:
			| ExportPayload
			| Pick<ExportPayload, "expenses">
			| Pick<ExportPayload, "categories">
			| Pick<ExportPayload, "activityLogs"> =
			normalizedPayload;

		if (!type || type === "all") {
			payload = normalizedPayload;
		} else if (type === "expenses") {
			payload = { expenses: normalizedPayload.expenses };
		} else if (type === "categories") {
			payload = { categories: normalizedPayload.categories };
		} else if (type === "logs") {
			payload = {
				activityLogs: normalizedPayload.activityLogs,
			};
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
