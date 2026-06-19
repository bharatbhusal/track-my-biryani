"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiLogOut, FiMoon, FiSun } from "react-icons/fi";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useAuthActions,
	useAuthMe,
} from "@/hooks/api/use-auth-api";

export function SettingsPage() {
	const router = useRouter();
	const { resolvedTheme, setTheme } = useTheme();
	const authQuery = useAuthMe();
	const { logout } = useAuthActions();
	const currentTheme = resolvedTheme ?? "light";

	const handleLogout = async () => {
		try {
			await logout.mutateAsync();
			toast.success("Logged out");
			router.replace("/auth/login");
			router.refresh();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Logout failed",
			);
		}
	};

	return (
		<div className="mx-auto max-w-md space-y-4">
			<h3 className="text-base font-semibold tracking-tight">Settings</h3>

			<Card>
				{authQuery.isLoading ? (
					<div className="space-y-3">
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-4 w-48" />
					</div>
				) : (
					<>
						{authQuery.data ? (
							<div className="flex items-center justify-between gap-3">
								<div className="min-w-0">
									<p className="truncate text-sm font-medium">
										{authQuery.data.name}
									</p>
									<p className="truncate text-xs text-[var(--color-muted)]">
										Signed in
									</p>
								</div>
								<Button
									variant="ghost"
									size="sm"
									aria-label="Logout"
									onClick={handleLogout}
								>
									<FiLogOut className="mr-1.5" />
									Logout
								</Button>
							</div>
						) : (
							<div className="flex items-center justify-between gap-3">
								<p className="text-sm text-[var(--color-muted)]">
									Not signed in
								</p>
								<Link href="/auth/login">
									<Button size="sm">Login</Button>
								</Link>
							</div>
						)}
					</>
				)}
			</Card>

			<Card>
				<div className="flex items-center justify-between gap-3">
					<div className="min-w-0">
						<p className="text-sm font-medium">Theme</p>
						<p className="text-xs text-[var(--color-muted)] capitalize">
							{currentTheme}
						</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						aria-label="Toggle theme"
						onClick={() =>
							setTheme(currentTheme === "dark" ? "light" : "dark")
						}
					>
						<FiMoon className="dark:hidden" />
						<FiSun className="hidden dark:block" />
					</Button>
				</div>
			</Card>
		</div>
	);
}
