import { apiRequest } from "@/lib/api/client";

export const analyticsApi = {
	exportData: (type?: "all" | "expenses" | "categories") =>
		apiRequest<{
			data: string;
			filename: string;
			mimeType: string;
			exportedAt: string;
		}>(
			`/export?format=json${type ? `&type=${encodeURIComponent(type)}` : ""}`,
		),
};
