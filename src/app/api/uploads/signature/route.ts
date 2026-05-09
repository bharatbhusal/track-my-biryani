import { getAuthPayload } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { createUploadSignature } from '@/lib/cloudinary';
import { env } from '@/config/env';

export async function GET() {
  try {
    await getAuthPayload();
    const signature = createUploadSignature(env.CLOUDINARY_FOLDER_NAME);
    return successResponse(signature);
  } catch (error) {
    return errorResponse(error);
  }
}
