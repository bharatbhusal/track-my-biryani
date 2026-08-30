import { Card, CardTitle } from "@/components/ui/card";
import { CategoryForm } from "@/features/categories/components/category-form";

export const metadata = {
  title: "Edit Category",
};

export default async function CategoryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <section className="space-y-4 py-4">
      <Card>
        <CardTitle className="mb-3">Edit Category</CardTitle>
        <CategoryForm id={id} />
      </Card>
    </section>
  );
}
