export type DashboardCard = {
	key: string;
	title: string;
	value: number;
};

export type DashboardAnalytics = {
	totalSpend: number;
	averageSpend: number;
	chartLabel: string;
	rankedCategories: CategoryBreakdownPoint[];
	stackedSeries: Array<Record<string, string | number>>;
	periodLabel: string;
	cards: DashboardCard[];
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
	trend: TrendPoint[];
};

export type ActivityLogItem = {
	_id: string;
	action: string;
	entityType: string;
	entityId?: string;
	timestamp: string;
};
