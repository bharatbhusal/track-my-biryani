import { getAuthPayload } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { createUploadSignature } from '@/lib/cloudinary';

export async function GET() {
  try {
    await getAuthPayload();
    const signature = createUploadSignature('expense-tracker');
    return successResponse(signature);
  } catch (error) {
    return errorResponse(error);
  }
}
