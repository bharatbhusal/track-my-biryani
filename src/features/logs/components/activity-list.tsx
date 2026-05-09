'use client';

import { Card, CardTitle } from '@/components/ui/card';
import { useActivityLogsQuery } from '@/hooks/api/use-analytics-api';
import { formatDate } from '@/lib/format';
import { useUIStore } from '@/store/ui-store';

export function ActivityList() {
  const logsQuery = useActivityLogsQuery(1, 25);
  const locale = useUIStore((state) => state.locale);
  const timezone = useUIStore((state) => state.timezone);

  return (
    <Card>
      <CardTitle className="mb-3">Recent Activity</CardTitle>
      <ul className="space-y-2 text-sm">
        {(logsQuery.data ?? []).map((log) => (
          <li key={log._id} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="font-medium capitalize">{log.action}</p>
            <p className="text-xs text-zinc-500">
              {log.entityType} {log.entityId ?? ''} • {formatDate(log.timestamp, locale, timezone)}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
