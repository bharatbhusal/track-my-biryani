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

	return (
		<section className="space-y-4 py-4">
			<h1 className="text-xl font-semibold">Edit Category</h1>
			<CategoryEditForm id={id} />
		</section>
	);
}
