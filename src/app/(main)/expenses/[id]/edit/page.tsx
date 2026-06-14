import { getServerExpenseForm } from "@/lib/server/queries";
import { ExpenseEditForm } from "@/features/expenses/components/expense-edit-form";

export const metadata = {
	title: "Edit Expense",
};

export default async function ExpenseEditPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const { expense, categories } = await getServerExpenseForm(id);

	return (
		<section className="space-y-4 py-4">
			<ExpenseEditForm
				id={id}
				initialExpense={expense}
				initialCategories={categories}
			/>
		</section>
	);
}
