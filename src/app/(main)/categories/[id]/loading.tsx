import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CategoryDetailLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-52" />
      <Card>
        <div className="flex justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded" />
            <Skeleton className="h-9 w-9 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <Skeleton className="h-4 w-32 mb-3" />
        <div className="flex h-64 items-end justify-around">
          {[60, 80, 45, 90, 55, 70, 85].map((h, i) => (
            <div key={i} className="w-4" style={{ height: `${h}%` }}>
              <Skeleton className="h-full w-full rounded-sm" />
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <Skeleton className="h-4 w-32 mb-3" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}
