import { getAuthPayload } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { connectToDatabase } from '@/lib/db';
import { importDataSchema } from '@/lib/validators';
import { createCategory, listCategories } from '@/repositories/category.repository';
import { createExpense } from '@/repositories/expense.repository';
import { logAuditEvent } from '@/services/audit.service';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const auth = await getAuthPayload();
    const payload = importDataSchema.parse(await request.json());

    const existingCategories = await listCategories(auth.userId);
    const categoryMap = new Map<string, string>(existingCategories.map((category) => [category.name.toLowerCase(), category._id.toString()]));

    for (const category of payload.categories) {
      if (!categoryMap.has(category.name.toLowerCase())) {
        const created = await createCategory({
          userId: auth.userId,
          name: category.name,
          color: category.color,
        });
        categoryMap.set(created.name.toLowerCase(), created._id.toString());
      }
    }

    for (const expense of payload.expenses) {
      const categoryId = categoryMap.get(expense.categoryName.toLowerCase());
      if (!categoryId) {
        continue;
      }

      await createExpense({
        userId: auth.userId,
        title: expense.title,
        amount: expense.amount,
        categoryId,
        images: expense.images,
        location: expense.location,
        currency: expense.currency,
        dateTime: new Date(expense.dateTime),
      });
    }

    await logAuditEvent({
      userId: auth.userId,
      action: 'import',
      entityType: 'data',
      metadata: { expenseCount: payload.expenses.length },
    });

    return successResponse({ message: 'Import successful' }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
