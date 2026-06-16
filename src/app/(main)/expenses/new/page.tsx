import { getServerCategoriesList } from "@/lib/server/queries";
import { ExpenseForm } from "@/features/expenses/components/expense-form";

export const metadata = {
	title: "New Expense",
};

export default async function NewExpensePage() {
	const categories = await getServerCategoriesList();

	return <ExpenseForm initialCategories={categories} />;
}
