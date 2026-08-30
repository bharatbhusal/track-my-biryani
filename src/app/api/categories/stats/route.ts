import { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { listCategoriesWithStats } from "@/controllers/category.controller";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await listCategoriesWithStats(request);
    return successResponse(data);
  } catch (error) {
    return errorResponse(error);
  }
}
