import { getAuthPayload } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { connectToDatabase } from '@/lib/db';
import { listCategories } from '@/repositories/category.repository';
import { listExpensesForRange, listRecentExpenses } from '@/repositories/expense.repository';

function getDateRanges() {
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startWeek = new Date(now);
  startWeek.setDate(now.getDate() - 6);
  startWeek.setHours(0, 0, 0, 0);

  return { now, startMonth, startWeek };
}

export async function GET() {
  try {
    await connectToDatabase();
    const auth = await getAuthPayload();
    const { now, startMonth, startWeek } = getDateRanges();

    const [monthlyExpenses, weeklyExpenses, categories, recentActivity] = await Promise.all([
      listExpensesForRange(auth.userId, startMonth, now),
      listExpensesForRange(auth.userId, startWeek, now),
      listCategories(auth.userId),
      listRecentExpenses(auth.userId, 8),
    ]);

    const totalMonthlySpend = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);
    const weeklySpend = weeklyExpenses.reduce((sum, item) => sum + item.amount, 0);
    const dailyAverage = weeklyExpenses.length > 0 ? weeklySpend / 7 : 0;

    const categoryMap = new Map<string, number>();
    monthlyExpenses.forEach((expense) => {
      const key = expense.categoryId.toString();
      categoryMap.set(key, (categoryMap.get(key) ?? 0) + expense.amount);
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([categoryId, value]) => {
      const category = categories.find((item) => item._id.toString() === categoryId);
      return {
        name: category?.name ?? 'Uncategorized',
        value,
      };
    });

    const topCategory = categoryBreakdown.sort((a, b) => b.value - a.value)[0]?.name ?? '';

    const monthlyTrendMap = new Map<string, number>();
    monthlyExpenses.forEach((expense) => {
      const day = new Date(expense.dateTime).getDate().toString();
      monthlyTrendMap.set(day, (monthlyTrendMap.get(day) ?? 0) + expense.amount);
    });

    const weeklyTrendMap = new Map<string, number>();
    weeklyExpenses.forEach((expense) => {
      const day = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(expense.dateTime));
      weeklyTrendMap.set(day, (weeklyTrendMap.get(day) ?? 0) + expense.amount);
    });

    return successResponse({
      totalMonthlySpend,
      weeklySpend,
      dailyAverage,
      topCategory,
      categoryBreakdown,
      monthlyTrend: Array.from(monthlyTrendMap.entries()).map(([name, total]) => ({ name, total })),
      weeklyTrend: Array.from(weeklyTrendMap.entries()).map(([name, total]) => ({ name, total })),
      recentActivity: recentActivity.map((item) => ({
        title: item.title,
        amount: item.amount,
        dateTime: item.dateTime,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
