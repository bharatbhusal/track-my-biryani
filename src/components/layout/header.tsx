'use client';

import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMoon, FiSun } from 'react-icons/fi';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { useAuthActions } from '@/hooks/api/use-auth-api';

export function Header() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { logout } = useAuthActions();
  const currentTheme = resolvedTheme ?? 'light';

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg)_88%,transparent)] px-4 py-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
          Daily Expenses Tracker
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            aria-label="Toggle theme"
            onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
            className="p-2"
          >
            <FiMoon className="dark:hidden" />
            <FiSun className="hidden dark:block" />
          </Button>
          <Button
            variant="outline"
            className="px-3 py-1.5 text-xs"
            onClick={async () => {
              try {
                await logout.mutateAsync();
                toast.success('Logged out');
                router.replace('/auth/login');
                router.refresh();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Logout failed');
              }
            }}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
