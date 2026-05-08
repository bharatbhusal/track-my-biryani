'use client';

import { useTheme } from 'next-themes';
import Link from 'next/link';
import { FiMoon, FiSun } from 'react-icons/fi';

import { Button } from '@/components/ui/button';

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/85 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
          Daily Expenses Tracker
        </Link>
        <Button
          variant="ghost"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2"
        >
          {theme === 'dark' ? <FiSun /> : <FiMoon />}
        </Button>
      </div>
    </header>
  );
}
