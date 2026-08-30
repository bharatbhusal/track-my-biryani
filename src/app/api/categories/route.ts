import { NextResponse, NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { createCategory } from "@/controllers/category.controller";

export async function GET() {
  return NextResponse.json(
    { success: false, error: { message: "Not found", code: "NOT_FOUND" } },
    { status: 404 },
  );
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await createCategory(request);
    return successResponse(data, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
