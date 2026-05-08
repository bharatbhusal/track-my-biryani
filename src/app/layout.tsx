import type { Metadata } from 'next';

import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { QuickAddButton } from '@/components/layout/quick-add-button';
import { AppProvider } from '@/components/providers/app-provider';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://daily-expenses-tracker.app'),
  title: {
    default: 'Daily Expenses Tracker',
    template: '%s | Daily Expenses Tracker',
  },
  description: 'Track daily expenses with analytics, categories, settings and audit logs.',
  openGraph: {
    title: 'Daily Expenses Tracker',
    description: 'A production-grade expenses tracker SaaS.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <AppProvider>
          <Header />
          <main className="mx-auto w-full max-w-5xl p-4 pb-24 md:pb-8">{children}</main>
          <BottomNav />
          <QuickAddButton />
        </AppProvider>
      </body>
    </html>
  );
}
