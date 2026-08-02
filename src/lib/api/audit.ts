import { apiRequest } from "@/lib/api/client";

export type AuditLogItem = {
	_id: string;
	action: string;
	entityType: string;
	entityId?: string;
	metadata?: Record<string, unknown>;
	timestamp: string;
};

export type AuditLogsListPayload = {
	items: AuditLogItem[];
	total: number;
	page: number;
	totalPages: number;
};

export const auditApi = {
	listLogs: (filters: { page?: number; limit?: number } = {}) => {
		const params = new URLSearchParams();
		if (filters.page) params.set("page", String(filters.page));
		if (filters.limit) params.set("limit", String(filters.limit));
		const qs = params.toString();
		return apiRequest<AuditLogsListPayload>(
			`/audit${qs ? `?${qs}` : ""}`,
		);
	},
};
