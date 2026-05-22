"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast-provider";

import { AppQueryProvider } from "@/components/providers/query-provider";
import { PwaProvider } from "@/components/providers/pwa-provider";
import { AppThemeProvider } from "@/components/providers/theme-provider";
import { useLocalePreferences } from "@/hooks/use-locale-preferences";

export function AppProvider({
	children,
}: {
	children: ReactNode;
}) {
	useLocalePreferences();

	return (
		<AppThemeProvider>
			<AppQueryProvider>
				<PwaProvider />
				{children}
				<ToastProvider />
			</AppQueryProvider>
		</AppThemeProvider>
	);
}
