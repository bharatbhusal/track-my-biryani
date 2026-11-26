import googleController from "@/controllers/google.controller";
import { errorResponse, successResponse } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";

export async function POST() {
  try {
    await connectToDatabase();
    const user = await googleController.beginSignIn({ mode: "link" });
    return successResponse(user);
  } catch (error) {
    return errorResponse(error);
  }
}
