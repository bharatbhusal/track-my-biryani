import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import { getBucketId } from "@/lib/bucket";
import {
	createCategoryService,
	deleteCategoryService,
	getCategoryDistributionService,
	getCategoryService,
	getCategoryStatsService,
	listCategoriesService,
	listCategoriesWithStatsService,
	updateCategoryService,
} from "@/services/category.service";

export async function listCategories(request: NextRequest) {
	const auth = await getAuthPayload();
	const bucketId = getBucketId(request);
	return listCategoriesService(auth.userId, bucketId);
}

export async function listCategoriesWithStats(request: NextRequest) {
	const auth = await getAuthPayload();
	const from = request.nextUrl.searchParams.get("from") ?? "";
	const to = request.nextUrl.searchParams.get("to") ?? "";
	const bucketId = getBucketId(request);
	return listCategoriesWithStatsService(
		auth.userId,
		bucketId,
		from,
		to,
	);
}

export async function createCategory(request: NextRequest) {
	const auth = await getAuthPayload();
	const bucketId = getBucketId(request);
	const body = await request.json();
	return createCategoryService(auth.userId, bucketId, body);
}

export async function getCategory(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const bucketId = getBucketId(request);
	const { id } = await context.params;
	return getCategoryService(auth.userId, id, bucketId);
}

export async function updateCategory(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const bucketId = getBucketId(request);
	const { id } = await context.params;
	const body = await request.json();
	return updateCategoryService(auth.userId, bucketId, id, body);
}

export async function deleteCategory(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const bucketId = getBucketId(request);
	const { id } = await context.params;
	return deleteCategoryService(auth.userId, bucketId, id);
}

export async function getCategoryStats(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	const from = request.nextUrl.searchParams.get("from") ?? "";
	const to = request.nextUrl.searchParams.get("to") ?? "";
	const bucketId = getBucketId(request);
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
	const from = request.nextUrl.searchParams.get("from") ?? "";
	const to = request.nextUrl.searchParams.get("to") ?? "";
	const bucketId = getBucketId(request);
	return getCategoryDistributionService(
		auth.userId,
		from,
		to,
		bucketId,
	);
}
