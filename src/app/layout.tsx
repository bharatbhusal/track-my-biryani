import type { Metadata, Viewport } from "next";

import { PageTransitionShell } from "@/animations/page-transition-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { QuickAddButton } from "@/components/layout/quick-add-button";
import { AppProvider } from "@/components/providers/app-provider";
import { DisableInteractions } from "@/components/ui/disable-interactions";
import { QuickAddExpenseModal } from "@/features/expenses/components/quick-add-expense-modal";
import { SettingsModal } from "@/features/settings/components/settings-modal";

import "./globals.css";
import { Header } from "@/components/layout/header";

const APP_THEME_COLOR = "#059669";

export const metadata: Metadata = {
	metadataBase: new URL(
		"https://daily-expenses-tracker.app",
	),
	manifest: "/manifest.webmanifest",
	title: {
		default: "Daily Expenses Tracker",
		template: "%s | Daily Expenses Tracker",
	},
	description:
		"Track daily expenses with analytics, categories, settings and audit logs.",
	openGraph: {
		title: "Daily Expenses Tracker",
		description: "A production-grade expenses tracker SaaS.",
		type: "website",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	themeColor: APP_THEME_COLOR,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className="min-h-screen transition-colors duration-200"
			>
				<AppProvider>
					<DisableInteractions />
					<Header />
					<main className="safe-area-px safe-area-pb mx-auto w-full max-w-6xl p-4 pb-24 pt-6 md:pb-8">
						<PageTransitionShell>{children}</PageTransitionShell>
					</main>
					<BottomNav />
					<QuickAddButton />
					<QuickAddExpenseModal />
					<SettingsModal />
				</AppProvider>
			</body>
		</html>
	);
}
