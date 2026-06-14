"use client";

import { useQuery } from "@tanstack/react-query";

import { analyticsApi } from "@/lib/api/analytics";
import { queryKeys } from "@/lib/api/query-keys";

export function useDashboardQuery(params?: {
	preset?: string;
	from?: string;
	to?: string;
	categoryId?: string;
}) {
	return useQuery({
		queryKey: [queryKeys.dashboard, params ?? {}],
		queryFn: () => analyticsApi.dashboard(params),
	});
}

