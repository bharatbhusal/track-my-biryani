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

	return (
		<section className="space-y-4 py-4">
			<h1 className="text-xl font-semibold">Edit Expense</h1>
			<ExpenseEditForm id={id} />
		</section>
	);
}
