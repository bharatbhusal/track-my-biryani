import { AppError } from "@/lib/errors";
import { resolveBucketContext } from "@/lib/bucket";
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
import {
	ensureCategoryInBucket,
	getCategoryById,
} from "@/repositories/category.repository";
import { findBucketById } from "@/repositories/bucket.repository";
import { findUserById } from "@/repositories/user.repository";
import { logAuditEvent } from "@/services/audit.service";

export async function listExpensesService(
	userId: string,
	queryParams: Record<string, string>,
	bucketId?: string | null,
) {
	const ctx = await resolveBucketContext(userId, bucketId);
	const filters = expenseFiltersSchema.parse(queryParams);
	return listExpenses(userId, filters, ctx.bucketId);
}

export async function createExpenseService(
	userId: string,
	bucketId: string | null | undefined,
	body: unknown,
) {
	const payload = expenseSchema.parse(body);
	const ctx = await resolveBucketContext(userId, bucketId);

	const existing = await findUserById(userId);
	if (!existing) {
		throw new AppError(
			"User doesn't exist",
			409,
			"USER_DOESN'T_EXIST",
		);
	}

	const category = await getCategoryById(
		userId,
		payload.categoryId,
		ctx.bucketId,
	);
	if (!category) {
		throw new AppError(
			"Category does not belong to this bucket",
			400,
			"CATEGORY_NOT_IN_BUCKET",
		);
	}

	const expense = await createExpense({
		userId,
		bucketId: ctx.bucketId,
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
		actorId: userId,
		bucketId: ctx.bucketId,
		action: "create",
		entity: "expense",
		entityId: expense._id.toString(),
		note: `Created expense "${expense.title}"`,
		metadata: { amount: expense.amount },
	});

	return expense;
}

export async function getExpenseService(
	userId: string,
	expenseId: string,
	bucketId?: string | null,
) {
	const ctx = await resolveBucketContext(userId, bucketId);
	const expense = await getExpenseById(
		expenseId,
		ctx.bucketId,
	);
	if (!expense) {
		throw new AppError("Expense not found", 404, "NOT_FOUND");
	}
	return expense;
}

export async function updateExpenseService(
	userId: string,
	bucketId: string | null | undefined,
	expenseId: string,
	body: unknown,
) {
	const payload = expenseSchema.partial().parse(body);

	const current = await getExpenseById(expenseId);
	if (!current) {
		throw new AppError("Expense not found", 404, "NOT_FOUND");
	}

	const targetBucketId = payload.bucketId ?? current.bucketId;
	await resolveBucketContext(
		userId,
		bucketId ?? targetBucketId,
	);

	let categoryId: string;
	if (payload.categoryId) {
		const category = await getCategoryById(
			userId,
			payload.categoryId,
			targetBucketId,
		);
		if (!category) {
			throw new AppError(
				"Category does not belong to this bucket",
				400,
				"CATEGORY_NOT_IN_BUCKET",
			);
		}
		categoryId = category._id.toString();
	} else if (targetBucketId === current.bucketId) {
		categoryId = current.categoryId;
	} else {
		const sourceCategory = await getCategoryById(
			userId,
			current.categoryId,
			current.bucketId,
		);
		if (!sourceCategory) {
			throw new AppError(
				"Source category not found",
				400,
				"CATEGORY_NOT_IN_BUCKET",
			);
		}
		const destCategory = await ensureCategoryInBucket(
			userId,
			targetBucketId,
			{
				name: sourceCategory.name,
				color: sourceCategory.color,
				emoji: sourceCategory.emoji,
			},
		);
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
		const sourceName =
			(await findBucketById(sourceId))?.name ?? sourceId;
		const destName =
			(await findBucketById(destId))?.name ?? destId;
		await logAuditEvent({
			actorId: userId,
			bucketId: sourceId,
			action: "move-out",
			entity: "expense",
			entityId: expenseId,
			note: `Moved expense "${expense.title}" to ${destName}`,
		});
		await logAuditEvent({
			actorId: userId,
			bucketId: destId,
			action: "move-in",
			entity: "expense",
			entityId: expenseId,
			note: `Expense "${expense.title}" moved from ${sourceName}`,
		});
	} else {
		await logAuditEvent({
			actorId: userId,
			bucketId: current.bucketId.toString(),
			action: "update",
			entity: "expense",
			entityId: expenseId,
			note: `Updated expense "${expense.title}"`,
		});
	}

	return expense;
}

export async function deleteExpenseService(
	userId: string,
	expenseId: string,
	bucketId?: string | null,
) {
	const ctx = await resolveBucketContext(userId, bucketId);
	const deleted = await deleteExpense(
		userId,
		expenseId,
		ctx.bucketId,
	);
	if (!deleted) {
		throw new AppError("Expense not found", 404, "NOT_FOUND");
	}

	await logAuditEvent({
		actorId: userId,
		bucketId: ctx.bucketId,
		action: "delete",
		entity: "expense",
		entityId: expenseId,
		note: `Deleted expense "${deleted.title}"`,
	});

	return { message: "Expense deleted" };
}

export async function getContributionService(
	userId: string,
	expenseId: string,
	bucketId?: string | null,
	from?: string,
	to?: string,
) {
	const ctx = await resolveBucketContext(userId, bucketId);
	const data = await getExpenseContribution(
		userId,
		expenseId,
		ctx.bucketId,
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
	bucketId?: string | null,
) {
	if (!from || !to) {
		throw new AppError(
			"from and to query params are required",
			400,
		);
	}
	const ctx = await resolveBucketContext(userId, bucketId);
	const fromDate = new Date(from);
	const toDate = new Date(to);
	const { total } = await getExpenseOverviewStats(
		userId,
		fromDate,
		toDate,
		ctx.bucketId,
	);

	const dayDiff = Math.ceil(
		(toDate.getTime() - fromDate.getTime()) /
			(1000 * 60 * 60 * 24),
	);

	let periodCount: number;
	let perPeriodLabel: string;
	if (dayDiff <= 60) {
		periodCount = Math.max(1, dayDiff);
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
					? "Per Month Spend"
					: "Per Day Spend",
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
	bucketId?: string | null,
) {
	if (!from || !to) {
		throw new AppError(
			"from and to query params are required",
			400,
		);
	}
	const ctx = await resolveBucketContext(userId, bucketId);
	return getChartData(
		userId,
		new Date(from),
		new Date(to),
		ctx.bucketId,
		categoryId || undefined,
	);
}
