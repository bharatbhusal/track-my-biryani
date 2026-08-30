import { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { getContribution } from "@/controllers/expense.controller";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const data = await getContribution(request, context);
    return successResponse(data);
  } catch (error) {
    return errorResponse(error);
  }
}
