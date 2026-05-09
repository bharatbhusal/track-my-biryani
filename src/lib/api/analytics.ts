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
	logsWithRange: (
		page = 1,
		limit = 25,
		params?: {
			preset?: string;
			from?: string;
			to?: string;
		},
	) => {
		const query = new URLSearchParams({
			page: String(page),
			limit: String(limit),
		});

		if (params?.preset) {
			query.set("preset", params.preset);
		}
		if (params?.from) {
			query.set("from", params.from);
		}
		if (params?.to) {
			query.set("to", params.to);
		}

		return apiRequest<ActivityLogList>(
			`/logs?${query.toString()}`,
		);
	},
	exportData: (
		type?: "all" | "expenses" | "categories" | "logs",
	) =>
		apiRequest<{
			data: string;
			filename: string;
			mimeType: string;
			exportedAt: string;
		}>(
			`/export?format=json${type ? `&type=${encodeURIComponent(type)}` : ""}`,
		),
	updateSettings: (payload: unknown) =>
		apiRequest<{ message: string }>("/settings", {
			method: "PATCH",
			body: payload,
		}),
};
