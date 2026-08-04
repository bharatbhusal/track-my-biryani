export type DashboardCard = {
	key: string;
	title: string;
	value: number;
};

export type DashboardAnalytics = {
	totalSpend: number;
	averageSpend: number;
};

export type TrendPoint = {
	name: string;
	total: number;
};

export type CategoryBreakdownPoint = {
	name: string;
	value: number;
	color: string;
	categoryId: string;
};

export type RecentActivityPoint = {
	title: string;
	amount: number;
	paidAt: string;
};

export type ExpenseContribution = {
	expenseId: string;
	amount: number;
	weekTotal: number;
	monthTotal: number;
	yearTotal: number;
	categoryTotal: number;
	categoryExpenseCount: number;
	categoryAverage: number;
	weekContributionPercent: number;
	monthContributionPercent: number;
	yearContributionPercent: number;
	categoryContributionPercent: number;
	monthlyTrend: TrendPoint[];
};

export type CategoryRangeStats = {
	total: number;
	count: number;
	avg: number;
	min: number;
	max: number;
	pct: number;
	trend: TrendPoint[];
};

export type CategoryWithStats = {
	_id: string;
	name: string;
	color: string;
	emoji?: string;
	total: number;
	count: number;
	min: number;
	max: number;
	avg: number;
	pct: number;
};

export type ChartData = {
	series: Array<Record<string, string | number>>;
	categoryColors: Record<string, string>;
};
