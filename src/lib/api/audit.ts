import { apiRequest } from "@/lib/api/client";

export type AuditLogItem = {
	_id: string;
	action: string;
	entity: string;
	entityId?: string;
	note?: string;
	actorName?: string;
	actorUsername?: string;
	bucketName?: string;
	bucketIcon?: string;
	timestamp: string;
	metadata?: Record<string, unknown>;
};

export type AuditLogsListPayload = {
	items: AuditLogItem[];
	total: number;
	page: number;
	totalPages: number;
};

export type AuditLogListQuery = {
	page?: number;
	limit?: number;
	bucketId?: string;
	sortBy?: "timestamp" | "action" | "entity";
	order?: "asc" | "desc";
};

export const auditApi = {
	listLogs: (filters: AuditLogListQuery = {}) => {
		const params = new URLSearchParams();
		if (filters.page !== undefined) params.set("page", String(filters.page));
		if (filters.limit !== undefined) params.set("limit", String(filters.limit));
		if (filters.sortBy) params.set("sortBy", filters.sortBy);
		if (filters.order) params.set("order", filters.order);
		const qs = params.toString();
		return apiRequest<AuditLogsListPayload>(
			`/audit${qs ? `?${qs}` : ""}`,
			{ bucketId: filters.bucketId },
		);
	},
};
