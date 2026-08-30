import { errorResponse, successResponse } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import { logoutUser } from "@/controllers/user.controller";

export async function POST() {
  try {
    await connectToDatabase();
    const data = await logoutUser();
    return successResponse(data);
  } catch (error) {
    return errorResponse(error);
  }
}
