import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function ExpenseDetailLoading() {
	return (
		<div className="space-y-4">
			<Card>
				<div className="flex justify-between mb-4">
					<Skeleton className="h-6 w-48" />
					<div className="flex gap-2">
						<Skeleton className="h-9 w-9 rounded" />
						<Skeleton className="h-9 w-9 rounded" />
					</div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					{[...Array(6)].map((_, i) => (
						<Skeleton key={i} className="h-5 w-full" />
					))}
				</div>
			</Card>
			<Card>
				<Skeleton className="h-6 w-32 mb-4" />
				<Skeleton className="h-40 w-full" />
			</Card>
		</div>
	);
}
