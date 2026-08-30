import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function ExpensesLoading() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </Card>
      <Card>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}
