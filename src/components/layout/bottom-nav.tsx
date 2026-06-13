"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiGrid, FiList, FiTag } from "react-icons/fi";

import { cn } from "@/lib/utils";

const items = [
	{ href: "/dashboard", label: "Dashboard", icon: FiGrid },
	{ href: "/expenses", label: "Expenses", icon: FiList },
	{ href: "/categories", label: "Categories", icon: FiTag },
];

export function BottomNav() {
	const pathname = usePathname();

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg)_92%,transparent)] backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--color-bg)_76%,transparent)]">
			<ul className="safe-area-pb mx-auto flex max-w-md items-center justify-around py-1">
				{items.map((item) => {
					const Icon = item.icon;
					const active = pathname.startsWith(item.href);
					return (
						<li key={item.href}>
							<Link
								href={item.href}
								className={cn(
									"flex flex-col items-center gap-0.5 rounded-2xl px-5 py-1.5 text-xs transition-all duration-200",
									active
										? "bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
										: "text-[var(--color-muted)] hover:text-[var(--color-text)]",
								)}
								aria-label={item.label}
							>
								<Icon className="text-xl" aria-hidden="true" />
								<span className="text-[10px] font-medium leading-none">
									{item.label}
								</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
