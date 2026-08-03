import { apiRequest } from "@/lib/api/client";

export const analyticsApi = {
	exportData: (
		type?: "all" | "expenses" | "categories",
		bucketId?: string | null,
	) =>
		apiRequest<{
			data: string;
			filename: string;
			mimeType: string;
			exportedAt: string;
		}>(
			`/export?format=json${type ? `&type=${encodeURIComponent(type)}` : ""}`,
			{ bucketId },
		),
};
