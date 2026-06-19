"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export function ToastProvider() {
	const { resolvedTheme } = useTheme();
	const theme = resolvedTheme === "dark" ? "dark" : "light";

	return (
		<Toaster
			position="top-center"
			theme={theme}
			style={{ paddingTop: "var(--safe-area-top)" }}
			toastOptions={{
				style: {
					background: "var(--color-surface)",
					color: "var(--color-text)",
					border: "1px solid var(--color-border)",
				},
			}}
		/>
	);
}
