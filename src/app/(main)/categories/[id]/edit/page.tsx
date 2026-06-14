import { getServerCategoryForm } from "@/lib/server/queries";
import { CategoryEditForm } from "@/features/categories/components/category-edit-form";

export const metadata = {
	title: "Edit Category",
};

export default async function CategoryEditPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const { category } = await getServerCategoryForm(id);

	return (
		<section className="space-y-4 py-4">
			<CategoryEditForm id={id} initialCategory={category} />
		</section>
	);
}
