import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import {
  createBudgetService,
  deleteBudgetService,
  listBudgetsService,
  updateBudgetService,
} from "@/services/budget.service";

export async function listBudgets() {
  const auth = await getAuthPayload();
  return listBudgetsService(auth.id);
}

export async function createBudget(request: NextRequest) {
  const auth = await getAuthPayload();
  const body = await request.json();
  return createBudgetService(auth.id, body);
}

export async function updateBudget(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthPayload();
  const { id } = await context.params;
  const body = await request.json();
  return updateBudgetService(auth.id, id, body);
}

export async function deleteBudget(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthPayload();
  const { id } = await context.params;
  return deleteBudgetService(auth.id, id);
}
