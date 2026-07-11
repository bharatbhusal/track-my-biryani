import { AppError } from "@/lib/errors";
import {
	expenseFiltersSchema,
	expenseSchema,
} from "@/lib/validators";
import {
	createExpense,
	deleteExpense,
	getExpenseById,
	getExpenseContribution,
	getExpenseOverviewStats,
	getChartData,
	listExpenses,
	updateExpense,
} from "@/repositories/expense.repository";
import { findUserById } from "@/repositories/user.repository";
import { logAuditEvent } from "@/services/audit.service";

export async function listExpensesService(
	userId: string,
	queryParams: Record<string, string>,
) {
	const filters = expenseFiltersSchema.parse(queryParams);
	return listExpenses(userId, filters);
}

export async function createExpenseService(
	userId: string,
	body: unknown,
) {
	const payload = expenseSchema.parse(body);

	const existing = await findUserById(userId);
	if (!existing) {
		throw new AppError(
			"User doesn't exist",
			409,
			"USER_DOESN'T_EXIST",
		);
	}

	const expense = await createExpense({
		userId,
		title: payload.title,
		amount: payload.amount,
		categoryId: payload.categoryId,
		notes: payload.notes,
		images: payload.images,
		location: payload.location,
		currency: payload.currency,
		paidAt: payload?.paidAt
			? new Date(payload.paidAt)
			: undefined,
	});

	await logAuditEvent({
		userId,
		action: "create",
		entityType: "expense",
		entityId: expense._id.toString(),
		metadata: { amount: expense.amount },
	});

	return expense;
}

export async function getExpenseService(
	userId: string,
	expenseId: string,
) {
	const expense = await getExpenseById(userId, expenseId);
	if (!expense) {
		throw new AppError("Expense not found", 404, "NOT_FOUND");
	}
	return expense;
}

export async function updateExpenseService(
	userId: string,
	expenseId: string,
	body: unknown,
) {
	const payload = expenseSchema.parse(body);
	const expense = await updateExpense(
		userId,
		expenseId,
		payload,
	);
	if (!expense) {
		throw new AppError("Expense not found", 404, "NOT_FOUND");
	}

	await logAuditEvent({
		userId,
		action: "update",
		entityType: "expense",
		entityId: expenseId,
	});

	return expense;
}

export async function deleteExpenseService(
	userId: string,
	expenseId: string,
) {
	const deleted = await deleteExpense(userId, expenseId);
	if (!deleted) {
		throw new AppError("Expense not found", 404, "NOT_FOUND");
	}

	await logAuditEvent({
		userId,
		action: "delete",
		entityType: "expense",
		entityId: expenseId,
	});

	return { message: "Expense deleted" };
}

export async function getContributionService(
	userId: string,
	expenseId: string,
	from?: string,
	to?: string,
) {
	const data = await getExpenseContribution(
		userId,
		expenseId,
		from ? new Date(from) : undefined,
		to ? new Date(to) : undefined,
	);
	if (!data) {
		throw new AppError("Expense not found", 404, "NOT_FOUND");
	}
	return data;
}

export async function getExpenseOverviewStatsService(
	userId: string,
	from: string,
	to: string,
) {
	if (!from || !to) {
		throw new AppError(
			"from and to query params are required",
			400,
		);
	}
	const fromDate = new Date(from);
	const toDate = new Date(to);
	const { total } = await getExpenseOverviewStats(
		userId,
		fromDate,
		toDate,
	);

	const dayDiff = Math.ceil(
		(toDate.getTime() - fromDate.getTime()) /
			(1000 * 60 * 60 * 24),
	);

	let periodCount: number;
	let perPeriodLabel: string;
	if (dayDiff <= 1) {
		periodCount = 1;
		perPeriodLabel = "spend_per_day";
	} else if (dayDiff <= 7) {
		periodCount = 7;
		perPeriodLabel = "spend_per_day";
	} else if (dayDiff <= 60) {
		periodCount = dayDiff;
		perPeriodLabel = "spend_per_day";
	} else {
		periodCount =
			toDate.getMonth() -
			fromDate.getMonth() +
			1 +
			(toDate.getFullYear() - fromDate.getFullYear()) * 12;
		perPeriodLabel = "spend_per_month";
	}

	const averageSpend =
		periodCount > 0 ? total / periodCount : total;

	const cards = [
		{
			key: "total_spend",
			title: "Total Spend",
			value: total,
		},
		{
			key: perPeriodLabel,
			title:
				perPeriodLabel === "spend_per_month"
					? "Spend per Month"
					: "Spend per Day",
			value: averageSpend,
		},
	];

	return cards;
}

export async function getChartDataService(
	userId: string,
	from: string,
	to: string,
	categoryId?: string,
) {
	if (!from || !to) {
		throw new AppError(
			"from and to query params are required",
			400,
		);
	}
	return getChartData(
		userId,
		new Date(from),
		new Date(to),
		categoryId || undefined,
	);
}
