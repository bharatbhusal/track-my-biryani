"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast-provider";

import { AppQueryProvider } from "@/components/providers/query-provider";
import { AppThemeProvider } from "@/components/providers/theme-provider";
import { useLocalePreferences } from "@/hooks/use-locale-preferences";

import "react-toastify/dist/ReactToastify.css";

export function AppProvider({
	children,
}: {
	children: ReactNode;
}) {
	useLocalePreferences();

	return (
		<AppThemeProvider>
			<AppQueryProvider>
				{children}
				<ToastProvider />
			</AppQueryProvider>
		</AppThemeProvider>
	);
}
