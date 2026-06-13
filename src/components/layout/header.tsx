"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiLogOut, FiMoon, FiSun } from "react-icons/fi";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	useAuthActions,
	useAuthMe,
} from "@/hooks/api/use-auth-api";

export function Header() {
	const router = useRouter();
	const { resolvedTheme, setTheme } = useTheme();
	const { logout } = useAuthActions();
	const authQuery = useAuthMe();
	const currentTheme = resolvedTheme ?? "light";

	return (
		<header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg)_88%,transparent)] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--color-bg)_72%,transparent)]">
			<div className="mx-auto flex w-full max-w-5xl items-center justify-between">
				<Link
					href="/dashboard"
					className="text-sm font-semibold tracking-tight"
				>
					Track My Biryani
				</Link>
				<div className="flex items-center gap-1.5">
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
					{authQuery.data ? (
						<>
							<span className="hidden text-xs text-[var(--color-muted)] sm:inline">
								{authQuery.data.name}
							</span>
							<Button
								variant="ghost"
								size="icon"
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
						</>
					) : (
						<Link href="/auth/login">
							<Button size="sm">Login</Button>
						</Link>
					)}
				</div>
			</div>
		</header>
	);
}
