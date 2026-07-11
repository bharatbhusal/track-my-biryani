import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
	return (
		<div className="space-y-2">
			<Skeleton className="h-10 w-52" />
			<div className="flex flex-wrap gap-2">
				{[...Array(2)].map((_, i) => (
					<div key={i} className="flex-1 min-w-[calc(50%-0.5rem)]">
						<Card>
							<Skeleton className="h-4 w-24 mb-2" />
							<Skeleton className="h-8 w-32" />
						</Card>
					</div>
				))}
			</div>
			<Card>
				<Skeleton className="h-4 w-48 mb-3" />
				<Skeleton className="h-10 w-full rounded-md mb-3" />
				<div className="flex flex-wrap gap-x-4 gap-y-2">
					{[...Array(4)].map((_, i) => (
						<div key={i} className="flex items-center gap-2">
							<Skeleton className="h-3 w-3 rounded-full" />
							<Skeleton className="h-4 w-20" />
						</div>
					))}
				</div>
			</Card>
			<Card>
				<Skeleton className="h-4 w-48 mb-3" />
				<div className="flex h-64 items-end justify-around">
					{[60, 80, 45, 90, 55, 70, 85].map((h, i) => (
						<div key={i} className="w-4" style={{ height: `${h}%` }}>
							<Skeleton className="h-full w-full rounded-sm" />
						</div>
					))}
				</div>
			</Card>
		</div>
	);
}
