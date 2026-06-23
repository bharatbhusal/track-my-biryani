import { BottomNav } from "@/components/layout/bottom-nav";
import { QuickAddButton } from "@/components/layout/quick-add-button";

export default function MainLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="flex min-h-dvh flex-col overflow-y-auto">
			<div
				className="fixed top-0 left-0 right-0 z-50"
				style={{
					height: "calc(env(safe-area-inset-top, 0px) + 1rem)",
					backdropFilter: "blur(12px)",
					WebkitBackdropFilter: "blur(12px)",
					maskImage:
						"linear-gradient(to bottom, black 60%, transparent)",
					WebkitMaskImage:
						"linear-gradient(to bottom, black 60%, transparent)",
				}}
			/>
			<div
				className="mx-auto flex-1 w-full max-w-5xl px-4 sm:px-6 lg:px-8 pb-18"
				style={{
					paddingTop:
						"calc(env(safe-area-inset-top, 0px) + 1rem)",
				}}
			>
				{children}
			</div>
			<BottomNav />
			<QuickAddButton />
		</div>
	);
}
