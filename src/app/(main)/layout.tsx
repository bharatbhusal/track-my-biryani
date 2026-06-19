import { BottomNav } from "@/components/layout/bottom-nav";
import { QuickAddButton } from "@/components/layout/quick-add-button";

export default function MainLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="flex min-h-dvh flex-col">
			<div className="mx-auto flex-1 w-full max-w-5xl px-4 py-4 sm:px-6 lg:px-8 pb-18 pt-[max(0.75rem,env(safe-area-inset-top))] main-content">
				{children}
			</div>
			<BottomNav />
			<QuickAddButton />
		</div>
	);
}
