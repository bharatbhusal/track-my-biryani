import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import {
	createExpenseService,
	deleteExpenseService,
	getChartDataService,
	getContributionService,
	getExpenseOverviewStatsService,
	getExpenseService,
	listExpensesService,
	updateExpenseService,
} from "@/services/expense.service";

export async function listExpenses(request: NextRequest) {
	const auth = await getAuthPayload();
	const bucketId =
		request.nextUrl.searchParams.get("bucketId") ?? undefined;
	const queryParams = Object.fromEntries(
		request.nextUrl.searchParams.entries(),
	);
	return listExpensesService(auth.userId, queryParams, bucketId);
}

export async function createExpense(request: NextRequest) {
	const auth = await getAuthPayload();
	const bucketId =
		request.nextUrl.searchParams.get("bucketId") ?? undefined;
	const body = await request.json();
	return createExpenseService(auth.userId, bucketId, body);
}

export async function getExpense(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const bucketId =
		request.nextUrl.searchParams.get("bucketId") ?? undefined;
	const { id } = await context.params;
	return getExpenseService(auth.userId, id, bucketId);
}

export async function updateExpense(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const bucketId =
		request.nextUrl.searchParams.get("bucketId") ?? undefined;
	const { id } = await context.params;
	const body = await request.json();
	return updateExpenseService(auth.userId, bucketId, id, body);
}

export async function deleteExpense(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const bucketId =
		request.nextUrl.searchParams.get("bucketId") ?? undefined;
	const { id } = await context.params;
	return deleteExpenseService(auth.userId, id, bucketId);
}

export async function getContribution(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const bucketId =
		request.nextUrl.searchParams.get("bucketId") ?? undefined;
	const { id } = await context.params;
	const from =
		request.nextUrl.searchParams.get("from") ?? undefined;
	const to =
		request.nextUrl.searchParams.get("to") ?? undefined;
	return getContributionService(
		auth.userId,
		id,
		bucketId,
		from,
		to,
	);
}

export async function getExpenseOverviewStats(
	request: NextRequest,
) {
	const auth = await getAuthPayload();
	const from =
		request.nextUrl.searchParams.get("from") ?? "";
	const to = request.nextUrl.searchParams.get("to") ?? "";
	const bucketId =
		request.nextUrl.searchParams.get("bucketId") ?? undefined;
	return getExpenseOverviewStatsService(
		auth.userId,
		from,
		to,
		bucketId,
	);
}

export async function getChartData(request: NextRequest) {
	const auth = await getAuthPayload();
	const from =
		request.nextUrl.searchParams.get("from") ?? "";
	const to = request.nextUrl.searchParams.get("to") ?? "";
	const categoryId =
		request.nextUrl.searchParams.get("categoryId") ??
		undefined;
	const bucketId =
		request.nextUrl.searchParams.get("bucketId") ?? undefined;
	return getChartDataService(
		auth.userId,
		from,
		to,
		categoryId,
		bucketId,
	);
}
