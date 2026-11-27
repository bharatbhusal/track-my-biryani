import { NextRequest } from "next/server";

import authController from "@/controllers/auth.controller";
import { errorResponse, successResponse } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    const data = await authController.updateCredentials(request);
    return successResponse(data);
  } catch (error) {
    return errorResponse(error);
  }
}
