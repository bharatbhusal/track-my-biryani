"use client";

export function ChartSkeleton() {
	return (
		<div className="h-64 space-y-3 p-4">
			<svg
				viewBox="0 0 100 100"
				preserveAspectRatio="none"
				className="h-full w-full animate-pulse"
			>
				<polyline
					points="0,80 12,70 24,78 38,52 52,66 66,30 80,58 100,42"
					fill="none"
					stroke="var(--color-surface-muted)"
					strokeWidth="3"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</div>
	);
}
