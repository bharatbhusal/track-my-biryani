import { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { requestToJoin } from "@/controllers/bucket.controller";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const data = await requestToJoin(request, context);
    return successResponse(data, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
