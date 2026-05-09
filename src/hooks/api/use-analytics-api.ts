"use client";

import {
	useMutation,
	useQuery,
} from "@tanstack/react-query";

import { analyticsApi } from "@/lib/api/analytics";
import { queryKeys } from "@/lib/api/query-keys";

export function useDashboardQuery(params?: {
	preset?: string;
	from?: string;
	to?: string;
}) {
	return useQuery({
		queryKey: [queryKeys.dashboard, params ?? {}],
		queryFn: () => analyticsApi.dashboard(params),
	});
}

export function useActivityLogsQuery(page = 1, limit = 25) {
	return useActivityLogsQueryWithRange(page, limit);
}

export function useActivityLogsQueryWithRange(
	page = 1,
	limit = 25,
	params?: { preset?: string; from?: string; to?: string },
) {
	return useQuery({
		queryKey: queryKeys.logs.list(page, limit, params),
		queryFn: () =>
			analyticsApi.logsWithRange(page, limit, params),
		select: (payload) => payload.items,
	});
}

export function useSettingsMutations() {
	const updateSettings = useMutation({
		mutationFn: analyticsApi.updateSettings,
	});

	return { updateSettings };
}
