import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { createUploadSignature } from "@/lib/cloudinary";
import { env } from "@/config/env";

export async function GET(request: NextRequest) {
  try {
    await getAuthPayload();
    const publicId = request.nextUrl.searchParams.get("publicId") ?? undefined;
    const signature = createUploadSignature(env.CLOUDINARY_FOLDER_NAME, publicId);
    return successResponse(signature);
  } catch (error) {
    return errorResponse(error);
  }
}
