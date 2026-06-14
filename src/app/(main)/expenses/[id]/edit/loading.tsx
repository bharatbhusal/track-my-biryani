import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function EditExpenseLoading() {
	return (
		<Card>
			<div className="space-y-4">
				<Skeleton className="h-6 w-40" />
				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-10 w-full" />
					</div>
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-10 w-full" />
				</div>
				<Skeleton className="h-10 w-32" />
			</div>
		</Card>
	);
}
