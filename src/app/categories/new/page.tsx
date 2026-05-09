import { CategoryManager } from "@/features/categories/components/category-manager";

export const metadata = {
	title: "Create Category",
};

export default function CategoryCreatePage() {
	return (
		<section className="space-y-4 py-4">
			<h1 className="text-xl font-semibold">
				Create Category
			</h1>
			<CategoryManager />
		</section>
	);
}
