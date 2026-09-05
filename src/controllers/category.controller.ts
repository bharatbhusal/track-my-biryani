import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import {
  createCategoryService,
  deleteCategoryService,
  getCategoryDistributionService,
  getCategoryService,
  getCategoryStatsService,
  getCategoryStatsSummaryService,
  listCategoriesWithStatsService,
  searchCategoriesService,
  updateCategoryService,
} from "@/services/category.service";

export async function searchCategories(request: NextRequest) {
  const auth = await getAuthPayload();
  const body = await request.json();
  return searchCategoriesService(auth.id, body);
}

export async function listCategoriesWithStats(request: NextRequest) {
  const auth = await getAuthPayload();
  const body = await request.json().catch(() => ({}));
  return listCategoriesWithStatsService(auth.id, body);
}

export async function createCategory(request: NextRequest) {
  const auth = await getAuthPayload();
  const body = await request.json();
  return createCategoryService(auth.id, body);
}

export async function getCategory(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthPayload();
  const { id } = await context.params;
  return getCategoryService(auth.id, id);
}

export async function updateCategory(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthPayload();
  const { id } = await context.params;
  const body = await request.json();
  return updateCategoryService(auth.id, id, body);
}

export async function deleteCategory(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthPayload();
  const { id } = await context.params;
  return deleteCategoryService(auth.id, id);
}

export async function getCategoryStats(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthPayload();
  const { id } = await context.params;
  const from = request.nextUrl.searchParams.get("from") ?? "";
  const to = request.nextUrl.searchParams.get("to") ?? "";
  return getCategoryStatsService(auth.id, id, from, to);
}

export async function getCategoryDistribution(request: NextRequest) {
  const auth = await getAuthPayload();
  const body = await request.json().catch(() => ({}));
  return getCategoryDistributionService(auth.id, body);
}

export async function getCategoryStatsSummary(request: NextRequest) {
  const auth = await getAuthPayload();
  const body = await request.json().catch(() => ({}));
  return getCategoryStatsSummaryService(auth.id, body);
}
