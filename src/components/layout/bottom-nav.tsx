'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiGrid, FiList, FiSettings, FiTag } from 'react-icons/fi';

import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { href: '/expenses', label: 'Expenses', icon: FiList },
  { href: '/categories', label: 'Categories', icon: FiTag },
  { href: '/settings', label: 'Settings', icon: FiSettings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link href={item.href} className={cn('flex flex-col items-center py-2 text-xs', active ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500')}>
                <Icon className="mb-1 text-lg" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
