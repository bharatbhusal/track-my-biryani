export type DashboardAnalytics = {
  totalMonthlySpend: number;
  weeklySpend: number;
  dailyAverage: number;
  topCategory: string;
  categoryBreakdown: Array<{ name: string; value: number }>;
  monthlyTrend: Array<{ name: string; total: number }>;
  weeklyTrend: Array<{ name: string; total: number }>;
  recentActivity: Array<{ title: string; amount: number; dateTime: string }>;
};

export type ActivityLogItem = {
  _id: string;
  action: string;
  entityType: string;
  entityId?: string;
  timestamp: string;
};
