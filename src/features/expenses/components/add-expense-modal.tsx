'use client';

import { AppModal } from '@/components/ui/dialog';
import { ExpenseForm } from '@/features/expenses/components/expense-form';
import { useUIStore } from '@/store/ui-store';

export function AddExpenseModal() {
  const quickAddOpen = useUIStore((state) => state.quickAddOpen);
  const setQuickAddOpen = useUIStore((state) => state.setQuickAddOpen);

  return (
    <AppModal
      open={quickAddOpen}
      title="Add Expense"
      onClose={() => setQuickAddOpen(false)}
      fullScreenOnMobile
    >
      <ExpenseForm submitLabel="Save expense" onSuccess={() => setQuickAddOpen(false)} />
    </AppModal>
  );
}
