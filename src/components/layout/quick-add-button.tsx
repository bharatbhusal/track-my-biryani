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
      className="fixed bottom-20 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900 md:bottom-6"
    >
      <FiPlus className="text-lg" />
    </button>
  );
}
