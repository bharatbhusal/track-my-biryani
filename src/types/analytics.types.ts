export type DashboardAnalytics = {
	totalMonthlySpend: number;
	weeklySpend: number;
	dailyAverage: number;
	topCategory: string;
	categoryBreakdown: CategoryBreakdownPoint[];
	monthlyTrend: TrendPoint[];
	weeklyTrend: TrendPoint[];
	recentActivity: RecentActivityPoint[];
};

export type TrendPoint = {
	name: string;
	total: number;
};

export type CategoryBreakdownPoint = {
	name: string;
	value: number;
};

export type RecentActivityPoint = {
	title: string;
	amount: number;
	dateTime: string;
};

export type ExpenseContribution = {
	expenseId: string;
	amount: number;
	weekTotal: number;
	monthTotal: number;
	yearTotal: number;
	categoryTotal: number;
	weekContributionPercent: number;
	monthContributionPercent: number;
	yearContributionPercent: number;
	categoryContributionPercent: number;
};

export type ActivityLogItem = {
	_id: string;
	action: string;
	entityType: string;
	entityId?: string;
	timestamp: string;
};
