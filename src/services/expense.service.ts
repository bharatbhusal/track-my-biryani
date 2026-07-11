import { AppError } from "@/lib/errors";
import { expenseFiltersSchema, expenseSchema } from "@/lib/validators";
import {
	createExpense,
	deleteExpense,
	getExpenseById,
	getExpenseContribution,
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
	const expense = await updateExpense(userId, expenseId, payload);
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
