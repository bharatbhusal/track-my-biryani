import { apiRequest } from '@/lib/api/client';
import type { UploadSignaturePayload } from '@/types/upload.types';

export const uploadsApi = {
  getSignature: () => apiRequest<UploadSignaturePayload>('/uploads/signature'),
};
