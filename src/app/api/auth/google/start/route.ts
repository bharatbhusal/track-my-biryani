import { NextRequest } from "next/server";

import googleController from "@/controllers/google.controller";
import { errorResponse, successResponse } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => ({}));
    const user = await googleController.beginSignIn(body);
    return successResponse(user);
  } catch (error) {
    return errorResponse(error);
  }
}
