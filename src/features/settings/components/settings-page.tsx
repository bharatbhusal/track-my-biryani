/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	FiFileText,
	FiLogOut,
	FiMoon,
	FiSun,
	FiUsers,
} from "react-icons/fi";
import { toast } from "sonner";

import { BucketSwitcher } from "@/components/layout/bucket-switcher";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useAppSelector,
	useAppDispatch,
} from "@/store/hooks";
import {
	fetchMe,
	logoutUser,
} from "@/store/slices/authSlice";

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
		<div className="space-y-2">
			<div className="flex w-full justify-between items-center">
				<h2 className="text-lg font-semibold">
					Hi {authUser?.username || "User"}!
				</h2>
				<div>
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
					{authLoading ? (
						<div className="space-y-3">
							<Skeleton className="h-5 w-32" />
							<Skeleton className="h-4 w-48" />
						</div>
					) : authUser ? (
						<Button
							variant="ghost"
							size="sm"
							aria-label="Logout"
							onClick={handleLogout}
						>
							<FiLogOut className="mr-1.5" />
						</Button>
					) : (
						<Link href="/auth/login">
							<Button size="sm">Login</Button>
						</Link>
					)}
				</div>
			</div>

			<Card>
				<div className="space-y-2">
					<div>
						<p className="text-sm font-medium">Active bucket</p>
						<p className="text-xs text-[var(--color-muted)]">
							Choose which bucket expenses are shown for.
							Management happens on the Buckets page.
						</p>
					</div>
					<BucketSwitcher />
				</div>
			</Card>

			<Card>
				<Link
					href="/buckets"
					className="flex items-center justify-between gap-3"
				>
					<div className="min-w-0">
						<p className="text-sm font-medium">Buckets</p>
						<p className="truncate text-xs text-[var(--color-muted)]">
							Invitations and the buckets you&apos;re part of
						</p>
					</div>

					<Button
						variant="ghost"
						size="icon"
						aria-label="View buckets"
					>
						<FiUsers className="h-4 w-4" />
					</Button>
				</Link>
			</Card>
			<Card>
				<Link
					href="/logs"
					className="flex items-center justify-between gap-3"
				>
					<div className="min-w-0">
						<p className="text-sm font-medium">Logs</p>
						<p className="truncate text-xs text-[var(--color-muted)]">
							View all logged activity
						</p>
					</div>

					<Button
						variant="ghost"
						size="icon"
						aria-label="View logs"
					>
						<FiFileText className="h-4 w-4" />
					</Button>
				</Link>
			</Card>
		</div>
	);
}
