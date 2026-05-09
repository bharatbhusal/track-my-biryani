'use client';

import { FiPlus } from 'react-icons/fi';

import { useUIStore } from '@/store/ui-store';

export function QuickAddButton() {
  const setQuickAddOpen = useUIStore((state) => state.setQuickAddOpen);

  return (
    <button
      type="button"
      aria-label="Quick add expense"
      onClick={() => setQuickAddOpen(true)}
      className="fixed bottom-20 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-lg shadow-emerald-900/25 transition hover:brightness-110 md:bottom-6"
    >
      <FiPlus className="text-lg" />
    </button>
  );
}
