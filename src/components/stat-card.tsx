import type { ReactNode } from "react";
import { Card, CardTitle } from "@/components/ui/card";

type StatCardProps = {
	icon: ReactNode;
	title: string;
	value: string;
};

export function StatCard({ icon, title, value }: StatCardProps) {
	return (
		<Card>
			<div className="flex items-center gap-3">
				<div className="rounded-lg bg-[var(--color-surface-muted)] p-2">
					{icon}
				</div>
				<div>
					<CardTitle>{title}</CardTitle>
					<p className="mt-1 text-xl font-bold">{value}</p>
				</div>
			</div>
		</Card>
	);
}
