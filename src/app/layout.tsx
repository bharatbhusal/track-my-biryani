import type { Metadata, Viewport } from "next";

import { AppProvider } from "@/components/providers/app-provider";
import { UiRestriction } from "@/components/providers/ui-restriction";

import "./globals.css";

const APP_THEME_COLOR = "#1a1a1a";

export const metadata: Metadata = {
	metadataBase: new URL(
		"https://trackmybiryani.bharatbhusal.com",
	),
	manifest: "/manifest.webmanifest",
	title: {
		default: "Track My Biryani",
		template: "%s | Track My Biryani",
	},
	description:
		"Track daily expenses with analytics and categories.",
	other: {
		"apple-mobile-web-app-capable": "yes",
		"apple-mobile-web-app-status-bar-style": "black-translucent",
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
	viewportFit: "cover",
	themeColor: APP_THEME_COLOR,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="min-h-screen transition-colors duration-200 pb-20 sm:pb-2">
				<UiRestriction>
					<AppProvider>{children}</AppProvider>
				</UiRestriction>
			</body>
		</html>
	);
}
