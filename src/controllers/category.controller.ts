import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
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

export async function listCategories() {
	const auth = await getAuthPayload();
	return listCategoriesService(auth.userId);
}

export async function listCategoriesWithStats(request: NextRequest) {
	const auth = await getAuthPayload();
	const from = request.nextUrl.searchParams.get("from") ?? "";
	const to = request.nextUrl.searchParams.get("to") ?? "";
	return listCategoriesWithStatsService(auth.userId, from, to);
}

export async function createCategory(request: NextRequest) {
	const auth = await getAuthPayload();
	const body = await request.json();
	return createCategoryService(auth.userId, body);
}

export async function getCategory(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	return getCategoryService(auth.userId, id);
}

export async function updateCategory(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	const body = await request.json();
	return updateCategoryService(auth.userId, id, body);
}

export async function deleteCategory(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	return deleteCategoryService(auth.userId, id);
}

export async function getCategoryStats(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	const from = request.nextUrl.searchParams.get("from") ?? "";
	const to = request.nextUrl.searchParams.get("to") ?? "";
	return getCategoryStatsService(auth.userId, id, from, to);
}

export async function getCategoryDistribution(
	request: NextRequest,
) {
	const auth = await getAuthPayload();
	const from = request.nextUrl.searchParams.get("from") ?? "";
	const to = request.nextUrl.searchParams.get("to") ?? "";
	return getCategoryDistributionService(auth.userId, from, to);
}
