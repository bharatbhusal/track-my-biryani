"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	FiGrid,
	FiList,
	FiPieChart,
	FiSettings,
	FiTag,
} from "react-icons/fi";

import { cn } from "@/lib/utils";

const items = [
	{ href: "/dashboard", label: "Dashboard", icon: FiGrid },
	{ href: "/expenses", label: "Expenses", icon: FiList },
	{ href: "/logs", label: "Logs", icon: FiPieChart },
	{ href: "/categories", label: "Categories", icon: FiTag },
	{ href: "/settings", label: "Settings", icon: FiSettings },
];

export function BottomNav() {
	const pathname = usePathname();

	return (
		<nav className="safe-area-pb fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg)_92%,transparent)] backdrop-blur">
			<ul className="mx-auto grid max-w-md grid-cols-5">
				{items.map((item) => {
					const Icon = item.icon;
					const active = pathname.startsWith(item.href);
					return (
						<li key={item.href}>
							<Link
								href={item.href}
								className={cn(
									"flex flex-col items-center py-2 text-xs",
									active
										? "text-[var(--color-primary)]"
										: "text-[var(--color-muted)]",
								)}
								aria-label={item.label}
							>
								<Icon className="text-2xl" aria-hidden="true" />
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
