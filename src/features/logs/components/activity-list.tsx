'use client';

import { useQuery } from '@tanstack/react-query';

import { Card, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/format';

type Activity = {
  _id: string;
  action: string;
  entityType: string;
  entityId?: string;
  timestamp: string;
};

export function ActivityList() {
  const logsQuery = useQuery({
    queryKey: ['logs'],
    queryFn: async () => {
      const response = await fetch('/api/logs?page=1&limit=25');
      const payload = (await response.json()) as { data: { items: Activity[] } };
      return payload.data.items;
    },
  });

  return (
    <Card>
      <CardTitle className="mb-3">Recent Activity</CardTitle>
      <ul className="space-y-2 text-sm">
        {(logsQuery.data ?? []).map((log) => (
          <li key={log._id} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="font-medium capitalize">{log.action}</p>
            <p className="text-xs text-zinc-500">
              {log.entityType} {log.entityId ?? ''} • {formatDate(log.timestamp)}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
