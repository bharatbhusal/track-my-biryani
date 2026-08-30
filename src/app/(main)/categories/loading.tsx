import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CategoriesLoading() {
  return (
    <Card>
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-16" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </Card>
  );
}
