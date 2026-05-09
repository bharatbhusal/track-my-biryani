import * as React from 'react';

import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'destructive' | 'ghost';
};

export function Button({ className, variant = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]',
        variant === 'default' && 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:brightness-110',
        variant === 'outline' && 'border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-surface-muted)]',
        variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700',
        variant === 'ghost' && 'hover:bg-[var(--color-surface-muted)]',
        className,
      )}
      {...props}
    />
  );
}
