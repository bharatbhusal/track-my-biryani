import { apiRequest } from "@/lib/api/client";
import type {
	ActivityLogItem,
	DashboardAnalytics,
} from "@/types/analytics.types";
import type { PaginationMeta } from "@/types/common.types";

type ActivityLogList = PaginationMeta & {
	items: ActivityLogItem[];
};

export const analyticsApi = {
	dashboard: (params?: {
		preset?: string;
		from?: string;
		to?: string;
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
	logs: (page = 1, limit = 25) =>
		apiRequest<ActivityLogList>(
			`/logs?page=${page}&limit=${limit}`,
		),
	exportData: (format: "json" | "csv") =>
		apiRequest<{
			data: string;
			filename: string;
			mimeType: string;
			exportedAt: string;
		}>(`/export?format=${format}`),
	importData: (payload: unknown) =>
		apiRequest<{ message: string }>("/import", {
			method: "POST",
			body: payload,
		}),
	updateSettings: (payload: unknown) =>
		apiRequest<{ message: string }>("/settings", {
			method: "PATCH",
			body: payload,
		}),
};
