import { BottomNav } from "@/components/layout/bottom-nav";
import { QuickAddButton } from "@/components/layout/quick-add-button";
import { Header } from "@/components/layout/header";
import { QuickAddExpenseModal } from "@/features/expenses/components/quick-add-expense-modal";

export default function MainLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="flex min-h-dvh flex-col">
			<Header />
			<div className="mx-auto flex-1 w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 pb-18">
				{children}
			</div>
			<BottomNav />
			<QuickAddButton />
			<QuickAddExpenseModal />
		</div>
	);
}
