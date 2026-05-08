import { getAuthPayload } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { connectToDatabase } from '@/lib/db';
import { listCategories } from '@/repositories/category.repository';
import { listExpenses } from '@/repositories/expense.repository';

export async function GET() {
  try {
    await connectToDatabase();
    const auth = await getAuthPayload();

    const [categories, expenses] = await Promise.all([
      listCategories(auth.userId),
      listExpenses(auth.userId, {
        page: 1,
        limit: 1000,
        sortBy: 'dateTime',
        order: 'desc',
      }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      categories: categories.map((category) => ({
        name: category.name,
        color: category.color,
      })),
      expenses: expenses.items.map((expense) => ({
        title: expense.title,
        amount: expense.amount,
        categoryId: expense.categoryId.toString(),
        images: expense.images,
        location: expense.location,
        currency: expense.currency,
        dateTime: expense.dateTime,
      })),
    };

    return successResponse(payload);
  } catch (error) {
    return errorResponse(error);
  }
}
