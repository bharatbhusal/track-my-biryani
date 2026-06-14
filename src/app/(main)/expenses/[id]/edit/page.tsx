import { getServerExpenseForm } from "@/lib/server/queries";
import { ExpenseForm } from "@/features/expenses/components/expense-form";

export const metadata = {
	title: "Edit Expense",
};

export default async function ExpenseEditPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const { expense, categories } =
		await getServerExpenseForm(id);

	return (
		<ExpenseForm
			id={id}
			initialExpense={expense}
			initialCategories={categories}
		/>
	);
}
