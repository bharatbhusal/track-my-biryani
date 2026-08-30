import { NextRequest } from "next/server";

import { signupController } from "@/controllers/auth.controller";
import { errorResponse, successResponse } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const payload = await request.json();
    const user = await signupController(payload);
    return successResponse(user, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
