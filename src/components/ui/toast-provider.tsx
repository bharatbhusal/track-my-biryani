"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export function ToastProvider() {
	const { resolvedTheme } = useTheme();
	const theme = resolvedTheme === "dark" ? "dark" : "light";

	return (
		<Toaster
			position="top-right"
			theme={theme}
			richColors
		/>
	);
}
