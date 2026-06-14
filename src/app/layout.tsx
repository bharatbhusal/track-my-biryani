import type { Metadata, Viewport } from "next";

import { PageTransitionShell } from "@/animations/page-transition-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { QuickAddButton } from "@/components/layout/quick-add-button";
import { AppProvider } from "@/components/providers/app-provider";
import { QuickAddExpenseModal } from "@/features/expenses/components/quick-add-expense-modal";

import "./globals.css";
import { Header } from "@/components/layout/header";
import { UiRestriction } from "@/components/providers/ui-restriction";

const APP_THEME_COLOR = "#059669";

export const metadata: Metadata = {
	metadataBase: new URL("https://trackmybiryani.vercel.app"),
	manifest: "/manifest.webmanifest",
	title: {
		default: "Track My Biryani",
		template: "%s | Track My Biryani",
	},
	description:
		"Track daily expenses with analytics and categories.",
	other: {
		"apple-mobile-web-app-capable": "yes",
		"apple-mobile-web-app-status-bar-style": "default",
	},
	icons: [
		{ rel: "icon", url: "/logo_medium.jpeg" },
		{
			rel: "apple-touch-icon",
			url: "/logo_medium.jpeg",
		},
	],
	openGraph: {
		title: "Track My Biryani",
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
			<body className="min-h-screen transition-colors duration-200">
				<UiRestriction>
					<AppProvider>
						<div className="flex min-h-dvh flex-col">
							<Header />
							<div className="mx-auto flex-1 w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 pb-18">
								{children}
							</div>
							<BottomNav />
							<QuickAddButton />
							<QuickAddExpenseModal />
						</div>
					</AppProvider>
				</UiRestriction>
			</body>
		</html>
	);
}
