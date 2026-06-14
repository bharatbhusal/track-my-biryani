import { getServerExpenseDetail } from "@/lib/server/queries";
import { ExpenseDetailView } from "@/features/expenses/components/expense-detail-view";

export const metadata = {
	title: "Expense Details",
};

export default async function ExpenseDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const { expense, categories, contribution } = await getServerExpenseDetail(id);

	return (
		<ExpenseDetailView
			id={id}
			initialExpense={expense}
			initialCategories={categories}
			initialContribution={contribution}
		/>
	);
}
