import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import {
	createCategoryService,
	deleteCategoryService,
	getCategoryDistributionService,
	getCategoryService,
	getCategoryStatsService,
	getCategoryStatsSummaryService,
	listCategoriesService,
	listCategoriesWithStatsService,
	searchCategoriesService,
	updateCategoryService,
} from "@/services/category.service";

export async function searchCategories(request: NextRequest) {
	const auth = await getAuthPayload();
	const body = await request.json();
	return searchCategoriesService(auth.userId, body);
}

export async function listCategories(request: NextRequest) {
	const auth = await getAuthPayload();
	const bucketId =
		request.nextUrl.searchParams.get("bucketId") ?? undefined;
	return listCategoriesService(auth.userId, bucketId);
}

export async function listCategoriesWithStats(request: NextRequest) {
	const auth = await getAuthPayload();
	const from =
		request.nextUrl.searchParams.get("from") ?? "";
	const to = request.nextUrl.searchParams.get("to") ?? "";
	const bucketId =
		request.nextUrl.searchParams.get("bucketId") ?? undefined;
	return listCategoriesWithStatsService(
		auth.userId,
		bucketId,
		from,
		to,
	);
}

export async function createCategory(request: NextRequest) {
	const auth = await getAuthPayload();
	const body = await request.json();
	return createCategoryService(auth.userId, body.bucketId, body);
}

export async function getCategory(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	return getCategoryService(auth.userId, id, undefined);
}

export async function updateCategory(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	const body = await request.json();
	return updateCategoryService(auth.userId, body.bucketId, id, body);
}

export async function deleteCategory(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	return deleteCategoryService(auth.userId, undefined, id);
}

export async function getCategoryStats(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	const from =
		request.nextUrl.searchParams.get("from") ?? "";
	const to = request.nextUrl.searchParams.get("to") ?? "";
	const bucketId =
		request.nextUrl.searchParams.get("bucketId") ?? undefined;
	return getCategoryStatsService(
		auth.userId,
		id,
		from,
		to,
		bucketId,
	);
}

export async function getCategoryDistribution(
	request: NextRequest,
) {
	const auth = await getAuthPayload();
	const body = await request.json().catch(() => ({}));
	return getCategoryDistributionService(auth.userId, body);
}

export async function getCategoryStatsSummary(
	request: NextRequest,
) {
	const auth = await getAuthPayload();
	const body = await request.json().catch(() => ({}));
	return getCategoryStatsSummaryService(auth.userId, body);
}
