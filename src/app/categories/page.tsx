import { CategoryManager } from "@/features/categories/components/category-manager";

export const metadata = {
	title: "Categories",
};

export default function CategoriesPage() {
	return (
		<section className="space-y-4 py-4">
			<CategoryManager />
		</section>
	);
}
