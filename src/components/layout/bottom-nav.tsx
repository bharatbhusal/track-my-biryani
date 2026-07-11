"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	FiGrid,
	FiList,
	FiPlus,
	FiSettings,
	FiTag,
} from "react-icons/fi";

import { cn } from "@/lib/utils";

const items = [
	{ href: "/dashboard", label: "Dashboard", icon: FiGrid },
	{ href: "/expenses", label: "Expenses", icon: FiList },
	{
		href: "/expenses/new",
		label: "New",
		icon: FiPlus,
	},
	{ href: "/categories", label: "Categories", icon: FiTag },
	{ href: "/settings", label: "Settings", icon: FiSettings },
];

export function BottomNav() {
	const pathname = usePathname();

	return (
		<nav className="safe-area-pb pt-2 mt-4 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
			<ul className="mx-auto flex max-w-md items-center justify-around py-1">
				{items.map((item) => {
					const Icon = item.icon;
					let active = false;
					if (item.href === "/expenses/new") {
						active = pathname === "/expenses/new";
					} else if (item.href === "/expenses") {
						// Match /expenses exactly, or /expenses/... but NOT /expenses/new
						active =
							pathname === "/expenses" ||
							(pathname.startsWith("/expenses/") &&
								!pathname.startsWith("/expenses/new"));
					} else {
						active = pathname === item.href;
					}
					return (
						<Link
							key={item.href}
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
					);
				})}
			</ul>
		</nav>
	);
}
