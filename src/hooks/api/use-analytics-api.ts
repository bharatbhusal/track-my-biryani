'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import { analyticsApi } from '@/lib/api/analytics';
import { queryKeys } from '@/lib/api/query-keys';

export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: analyticsApi.dashboard,
  });
}

export function useActivityLogsQuery(page = 1, limit = 25) {
  return useQuery({
    queryKey: queryKeys.logs.list(page, limit),
    queryFn: () => analyticsApi.logs(page, limit),
    select: (payload) => payload.items,
  });
}

export function useSettingsMutations() {
  const updateSettings = useMutation({
    mutationFn: analyticsApi.updateSettings,
  });

  const importData = useMutation({
    mutationFn: analyticsApi.importData,
  });

  return { updateSettings, importData };
}
