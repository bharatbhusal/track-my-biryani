/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiLogOut, FiMoon, FiSun } from "react-icons/fi";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchMe, logoutUser } from "@/store/slices/authSlice";

export function SettingsPage() {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { resolvedTheme, setTheme } = useTheme();

	const authUser = useAppSelector((s) => s.auth.user);
	const authLoading = useAppSelector((s) => s.auth.loading);

	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		dispatch(fetchMe());
	}, [dispatch]);

	useEffect(() => {
		setMounted(true);
	}, []);

	const currentTheme = mounted
		? (resolvedTheme ?? "light")
		: null;

	const handleLogout = async () => {
		try {
			await dispatch(logoutUser()).unwrap();
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
	};

	return (
		<div className="space-y-4">
			<Card>
				{authLoading ? (
					<div className="space-y-3">
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-4 w-48" />
					</div>
				) : authUser ? (
					<div className="flex items-center justify-between gap-3">
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">
								{authUser.name}
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
			</Card>

			<Card>
				<div className="flex items-center justify-between gap-3">
					<div className="min-w-0">
						<p className="text-sm font-medium">Theme</p>

						{mounted ? (
							<p className="text-xs text-[var(--color-muted)] capitalize">
								{currentTheme}
							</p>
						) : (
							<Skeleton className="mt-1 h-3 w-12" />
						)}
					</div>

					<Button
						variant="ghost"
						size="icon"
						aria-label="Toggle theme"
						onClick={() =>
							setTheme(currentTheme === "dark" ? "light" : "dark")
						}
						disabled={!mounted}
					>
						<FiMoon className="dark:hidden" />
						<FiSun className="hidden dark:block" />
					</Button>
				</div>
			</Card>
		</div>
	);
}
