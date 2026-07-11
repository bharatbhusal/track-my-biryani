import { Skeleton } from "@/components/ui/skeleton";

export default function EditExpenseLoading() {
	return (
		<div className="h-full flex flex-col">
			<div className="flex flex-col items-center gap-6 px-4 pt-8">
				<Skeleton className="h-14 w-full max-w-xs" />
				<Skeleton className="h-10 w-full max-w-xs" />
			</div>
			<div className="space-y-3 px-4 pb-4">
				<div className="grid grid-cols-2 gap-3">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-12 flex-1" />
					<Skeleton className="h-12 flex-1" />
				</div>
			</div>
		</div>
	);
}
