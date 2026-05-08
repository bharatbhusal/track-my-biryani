import { CategoryManager } from '@/features/categories/components/category-manager';

export const metadata = {
  title: 'Categories',
};

export default function CategoriesPage() {
  return (
    <section className="space-y-4 py-4">
      <h1 className="text-xl font-semibold">Categories</h1>
      <CategoryManager />
    </section>
  );
}
