import { getServerCategoryDetail } from "@/lib/server/queries";
import { CategoryDetailView } from "@/features/categories/components/category-detail-view";

export const metadata = {
	title: "Category Details",
};

export default async function CategoryDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const { category, categoryExpenses } =
		await getServerCategoryDetail(id);

	return (
		<section className="space-y-4 py-4">
			<CategoryDetailView
				id={id}
				initialCategory={category}
				initialExpenses={categoryExpenses}
			/>
		</section>
	);
}
