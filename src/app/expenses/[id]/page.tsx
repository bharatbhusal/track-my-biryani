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

	return (
		<section className="space-y-4 py-4">
			<h1 className="text-xl font-semibold">
				Expense Details
			</h1>
			<ExpenseDetailView id={id} />
		</section>
	);
}
