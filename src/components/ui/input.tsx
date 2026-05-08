import * as React from 'react';

import { cn } from '@/lib/utils';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-offset-white placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:ring-offset-zinc-900 dark:focus:ring-zinc-300',
        className,
      )}
      {...props}
    />
  );
}
