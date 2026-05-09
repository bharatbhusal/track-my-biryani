import { ExpenseManager } from "@/features/expenses/components/expense-manager";

export const metadata = {
	title: "Create Expense",
};

export default function ExpenseCreatePage() {
	return (
		<section className="space-y-4 py-4">
			<h1 className="text-xl font-semibold">Create Expense</h1>
			<p className="text-sm text-[var(--color-muted)]">
				Use the Add Expense action to open the reusable expense
				modal.
			</p>
			<ExpenseManager />
		</section>
	);
}
