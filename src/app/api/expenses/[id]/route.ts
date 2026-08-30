import { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { deleteExpense, getExpense, updateExpense } from "@/controllers/expense.controller";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const data = await getExpense(request, context);
    return successResponse(data);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const data = await updateExpense(request, context);
    return successResponse(data);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const data = await deleteExpense(request, context);
    return successResponse(data);
  } catch (error) {
    return errorResponse(error);
  }
}
