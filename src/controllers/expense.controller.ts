import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import {
	createExpenseService,
	deleteExpenseService,
	getChartDataService,
	getContributionService,
	getDistributionService,
	getExpenseOverviewStatsService,
	getExpenseService,
	searchExpensesService,
	updateExpenseService,
} from "@/services/expense.service";

export async function searchExpenses(request: NextRequest) {
	const auth = await getAuthPayload();
	const body = await request.json();
	return searchExpensesService(auth.userId, body);
}

export async function getDistribution(request: NextRequest) {
	const auth = await getAuthPayload();
	const body = await request.json().catch(() => ({}));
	return getDistributionService(auth.userId, body);
}

export async function createExpense(request: NextRequest) {
	const auth = await getAuthPayload();
	const body = await request.json();
	return createExpenseService(auth.userId, body.bucketId, body);
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
	return updateExpenseService(auth.userId, body.bucketId, id, body);
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
	const from =
		request.nextUrl.searchParams.get("from") ?? undefined;
	const to =
		request.nextUrl.searchParams.get("to") ?? undefined;
	return getContributionService(
		auth.userId,
		id,
		undefined,
		from,
		to,
	);
}

export async function getExpenseOverviewStats(
	request: NextRequest,
) {
	const auth = await getAuthPayload();
	const body = await request.json().catch(() => ({}));
	const from =
		body?.from ??
		request.nextUrl.searchParams.get("from") ??
		"";
	const to =
		body?.to ?? request.nextUrl.searchParams.get("to") ?? "";
	const bucketId = body?.bucketId;
	return getExpenseOverviewStatsService(
		auth.userId,
		from,
		to,
		bucketId,
	);
}

export async function getChartData(request: NextRequest) {
	const auth = await getAuthPayload();
	const body = await request.json().catch(() => ({}));
	const from =
		body?.from ??
		request.nextUrl.searchParams.get("from") ??
		"";
	const to =
		body?.to ?? request.nextUrl.searchParams.get("to") ?? "";
	const categoryId =
		body?.categoryId ??
		request.nextUrl.searchParams.get("categoryId") ??
		undefined;
	const bucketId = body?.bucketId;
	return getChartDataService(
		auth.userId,
		from,
		to,
		categoryId,
		bucketId,
	);
}
