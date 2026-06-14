import { ExpenseManager } from "@/features/expenses/components/expense-manager";

export const metadata = {
	title: "Expenses",
};

export default function ExpensesPage() {
	return (
		<section className="space-y-4 py-4">
			<ExpenseManager />
		</section>
	);
}
