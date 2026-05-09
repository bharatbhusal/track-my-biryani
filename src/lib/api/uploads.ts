import { apiRequest } from "@/lib/api/client";
import type { UploadSignaturePayload } from "@/types/upload.types";

export const uploadsApi = {
	getSignature: (publicId?: string) =>
		apiRequest<UploadSignaturePayload>(
			`/uploads/signature${publicId ? `?publicId=${encodeURIComponent(publicId)}` : ""}`,
		),
};
