'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="expense-tracker-theme" enableColorScheme disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
