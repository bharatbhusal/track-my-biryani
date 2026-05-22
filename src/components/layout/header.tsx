"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiLogOut, FiMoon, FiSun } from "react-icons/fi";
import { toast } from "sonner";

import { TimeRangeSelector } from "@/components/charts/time-range-selector";
import { Button } from "@/components/ui/button";
import { useAuthActions } from "@/hooks/api/use-auth-api";
import { useAuthMe } from "@/hooks/api/use-auth-api";
import type { DateRangePreset } from "@/lib/date-range";
import { useUIStore } from "@/store/ui-store";

export function Header() {
	const router = useRouter();
	const pathname = usePathname();
	const { resolvedTheme, setTheme } = useTheme();
	const { logout } = useAuthActions();
	const authQuery = useAuthMe();
	const globalDateRange = useUIStore(
		(state) => state.globalDateRange,
	);
	const setGlobalDateRange = useUIStore(
		(state) => state.setGlobalDateRange,
	);
	const setCustomRangeModalOpen = useUIStore(
		(state) => state.setCustomRangeModalOpen,
	);
	const currentTheme = resolvedTheme ?? "light";
	const isAuthRoute = pathname.startsWith("/auth");

	const handleRangeChange = (preset: DateRangePreset) => {
		if (preset === "custom") {
			if (!pathname.startsWith("/dashboard")) {
				router.push("/dashboard");
			}
			setCustomRangeModalOpen(true);
			return;
		}

		setGlobalDateRange({ preset });
	};

	return (
		<header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg)_88%,transparent)] px-4 py-3 backdrop-blur">
			<div className="mx-auto flex w-full max-w-5xl items-center justify-between">
				<Link
					href="/dashboard"
					className="text-sm font-semibold tracking-tight"
				>
					Daily Expenses Tracker
				</Link>
				<div className="flex items-center gap-2">
					{authQuery.data && !isAuthRoute && (
						<TimeRangeSelector
							value={globalDateRange.preset}
							onChange={handleRangeChange}
							className="h-9 min-w-36"
						/>
					)}
					<Button
						variant="ghost"
						aria-label="Toggle theme"
						onClick={() =>
							setTheme(currentTheme === "dark" ? "light" : "dark")
						}
						className="p-2"
					>
						<FiMoon className="dark:hidden" />
						<FiSun className="hidden dark:block" />
					</Button>
					{authQuery.data ? (
						<Button
							variant="outline"
							className="h-9 w-9 p-0"
							aria-label="Logout"
							onClick={async () => {
								try {
									await logout.mutateAsync();
									toast.success("Logged out");
									router.replace("/auth/login");
									router.refresh();
								} catch (error) {
									toast.error(
										error instanceof Error
											? error.message
											: "Logout failed",
									);
								}
							}}
						>
							<FiLogOut />
						</Button>
					) : (
						<Link href="/auth/login">
							<Button
								variant="outline"
								className="px-3 py-1.5 text-xs"
							>
								Login
							</Button>
						</Link>
					)}
				</div>
			</div>
		</header>
	);
}
