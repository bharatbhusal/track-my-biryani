'use client';

import { Card, CardTitle } from '@/components/ui/card';
import { ExpenseForm } from '@/features/expenses/components/expense-form';
import { useExpensesQuery } from '@/hooks/api/use-expenses-api';
import { formatDateTime } from '@/lib/datetime';
import { formatCurrency } from '@/lib/format';
import { useUIStore } from '@/store/ui-store';

export function ExpenseManager() {
  const currency = useUIStore((state) => state.currency);
  const locale = useUIStore((state) => state.locale);
  const timezone = useUIStore((state) => state.timezone);
  const expensesQuery = useExpensesQuery(1, 20);

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle className="mb-3">Quick Add Expense</CardTitle>
        <ExpenseForm />
      </Card>

      <Card>
        <CardTitle className="mb-3">Recent Expenses</CardTitle>
        <ul className="space-y-2 text-sm">
          {(expensesQuery.data ?? []).map((expense) => (
            <li key={expense._id} className="flex items-center justify-between rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <div>
                <p className="font-medium">{expense.title}</p>
                <p className="text-xs text-zinc-500">{formatDateTime(expense.dateTime, locale, timezone)}</p>
              </div>
              <p className="font-semibold">{formatCurrency(expense.amount, expense.currency, locale)}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
