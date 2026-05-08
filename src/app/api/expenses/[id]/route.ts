import { NextRequest } from 'next/server';

import { getAuthPayload } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { connectToDatabase } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { expenseSchema } from '@/lib/validators';
import { deleteExpense, updateExpense } from '@/repositories/expense.repository';
import { logAuditEvent } from '@/services/audit.service';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const auth = await getAuthPayload();
    const payload = expenseSchema.parse(await request.json());
    const { id } = await context.params;

    const expense = await updateExpense(auth.userId, id, {
      ...payload,
      dateTime: new Date(payload.dateTime),
    });

    if (!expense) {
      throw new AppError('Expense not found', 404, 'NOT_FOUND');
    }

    await logAuditEvent({
      userId: auth.userId,
      action: 'update',
      entityType: 'expense',
      entityId: id,
    });

    return successResponse(expense);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const auth = await getAuthPayload();
    const { id } = await context.params;

    const deleted = await deleteExpense(auth.userId, id);
    if (!deleted) {
      throw new AppError('Expense not found', 404, 'NOT_FOUND');
    }

    await logAuditEvent({
      userId: auth.userId,
      action: 'delete',
      entityType: 'expense',
      entityId: id,
    });

    return successResponse({ message: 'Expense deleted' });
  } catch (error) {
    return errorResponse(error);
  }
}
