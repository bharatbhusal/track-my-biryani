'use client';

import { useQuery } from '@tanstack/react-query';

import { ExportableChart } from '@/components/charts/exportable-chart';
import { CategoryPieChart } from '@/components/charts/category-pie-chart';
import { MonthlyLineChart } from '@/components/charts/monthly-line-chart';
import { WeeklyBarChart } from '@/components/charts/weekly-bar-chart';
import { Card, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { useUIStore } from '@/store/ui-store';

type DashboardPayload = {
  totalMonthlySpend: number;
  weeklySpend: number;
  dailyAverage: number;
  topCategory: string;
  categoryBreakdown: Array<{ name: string; value: number }>;
  monthlyTrend: Array<{ name: string; total: number }>;
  weeklyTrend: Array<{ name: string; total: number }>;
  recentActivity: Array<{ title: string; amount: number; dateTime: string }>;
};

export function DashboardOverview() {
  const locale = useUIStore((state) => state.locale);
  const currency = useUIStore((state) => state.currency);

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard');
      const payload = (await response.json()) as { data: DashboardPayload };
      return payload.data;
    },
  });

  const data = dashboardQuery.data;

  if (!data) {
    return <Card>Loading dashboard...</Card>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardTitle>Total this month</CardTitle>
          <p className="mt-2 text-lg font-semibold">{formatCurrency(data.totalMonthlySpend, currency, locale)}</p>
        </Card>
        <Card>
          <CardTitle>Weekly spend</CardTitle>
          <p className="mt-2 text-lg font-semibold">{formatCurrency(data.weeklySpend, currency, locale)}</p>
        </Card>
        <Card>
          <CardTitle>Daily average</CardTitle>
          <p className="mt-2 text-lg font-semibold">{formatCurrency(data.dailyAverage, currency, locale)}</p>
        </Card>
        <Card>
          <CardTitle>Top category</CardTitle>
          <p className="mt-2 text-lg font-semibold">{data.topCategory || 'N/A'}</p>
        </Card>
      </div>

      <ExportableChart title="Category Breakdown">
        <CategoryPieChart data={data.categoryBreakdown} />
      </ExportableChart>
      <ExportableChart title="Monthly Trend">
        <MonthlyLineChart data={data.monthlyTrend} />
      </ExportableChart>
      <ExportableChart title="Weekly Spend">
        <WeeklyBarChart data={data.weeklyTrend} />
      </ExportableChart>
    </div>
  );
}
