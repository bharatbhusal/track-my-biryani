import { apiRequest } from "@/lib/api/client";
import type { DashboardAnalytics } from "@/types/analytics.types";

export const analyticsApi = {
	dashboard: (params?: {
		preset?: string;
		from?: string;
		to?: string;
		categoryId?: string;
	}) => {
		const qs = params
			? "?" +
				Object.entries(params)
					.filter(([, v]) => v !== undefined && v !== null)
					.map(
						([k, v]) =>
							`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
					)
					.join("&")
			: "";
		return apiRequest<DashboardAnalytics>(`/dashboard${qs}`);
	},
	exportData: (
		type?: "all" | "expenses" | "categories",
	) =>
		apiRequest<{
			data: string;
			filename: string;
			mimeType: string;
			exportedAt: string;
		}>(
			`/export?format=json${type ? `&type=${encodeURIComponent(type)}` : ""}`,
		),
};
