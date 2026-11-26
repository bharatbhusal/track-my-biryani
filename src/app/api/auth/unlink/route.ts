import googleController from "@/controllers/google.controller";
import { errorResponse, successResponse } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";

export async function POST() {
  try {
    await connectToDatabase();
    const result = await googleController.unlinkGoogle();
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
