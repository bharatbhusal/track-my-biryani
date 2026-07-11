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
	return (
		<section className="space-y-4 py-4">
			<CategoryDetailView id={id} />
		</section>
	);
}
