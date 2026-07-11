import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import {
	createExpenseService,
	deleteExpenseService,
	getContributionService,
	getExpenseService,
	listExpensesService,
	updateExpenseService,
} from "@/services/expense.service";

export async function listExpenses(request: NextRequest) {
	const auth = await getAuthPayload();
	const queryParams = Object.fromEntries(
		request.nextUrl.searchParams.entries(),
	);
	return listExpensesService(auth.userId, queryParams);
}

export async function createExpense(request: NextRequest) {
	const auth = await getAuthPayload();
	const body = await request.json();
	return createExpenseService(auth.userId, body);
}

export async function getExpense(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	return getExpenseService(auth.userId, id);
}

export async function updateExpense(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	const body = await request.json();
	return updateExpenseService(auth.userId, id, body);
}

export async function deleteExpense(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	return deleteExpenseService(auth.userId, id);
}

export async function getContribution(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	const from = request.nextUrl.searchParams.get("from") ?? undefined;
	const to = request.nextUrl.searchParams.get("to") ?? undefined;
	return getContributionService(auth.userId, id, from, to);
}
