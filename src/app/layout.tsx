import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import { PageTransitionShell } from "@/animations/page-transition-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { QuickAddButton } from "@/components/layout/quick-add-button";
import { AppProvider } from "@/components/providers/app-provider";
import { QuickAddExpenseModal } from "@/features/expenses/components/quick-add-expense-modal";

import "./globals.css";
import { Header } from "@/components/layout/header";

const manrope = Manrope({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
	variable: "--font-sans",
});

export const metadata: Metadata = {
	metadataBase: new URL(
		"https://daily-expenses-tracker.app",
	),
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

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${manrope.variable} min-h-screen transition-colors duration-200`}
			>
				<AppProvider>
					<Header />
					<main className="mx-auto w-full max-w-6xl p-4 pb-24 pt-6 md:pb-8">
						<PageTransitionShell>{children}</PageTransitionShell>
					</main>
					<BottomNav />
					<QuickAddButton />
					<QuickAddExpenseModal />
				</AppProvider>
			</body>
		</html>
	);
}
