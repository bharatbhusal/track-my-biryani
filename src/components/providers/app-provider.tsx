"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast-provider";

import { AppQueryProvider } from "@/components/providers/query-provider";
import { AppThemeProvider } from "@/components/providers/theme-provider";

import "react-toastify/dist/ReactToastify.css";

export function AppProvider({
	children,
}: {
	children: ReactNode;
}) {
	// Locale preferences detection removed; use defaults from UI store

	return (
		<AppThemeProvider>
			<AppQueryProvider>
				{children}
				<ToastProvider />
			</AppQueryProvider>
		</AppThemeProvider>
	);
}
