import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-6 w-52" />
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
				{[...Array(3)].map((_, i) => (
					<Card key={i}>
						<Skeleton className="h-4 w-24 mb-2" />
						<Skeleton className="h-8 w-32" />
					</Card>
				))}
			</div>
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Card>
					<Skeleton className="h-4 w-48 mb-3" />
					<Skeleton className="h-64 w-full" />
				</Card>
				<Card>
					<Skeleton className="h-4 w-48 mb-3" />
					<Skeleton className="h-64 w-full" />
				</Card>
			</div>
			<Card>
				<Skeleton className="h-4 w-48 mb-3" />
				<Skeleton className="h-64 w-full" />
			</Card>
		</div>
	);
}
