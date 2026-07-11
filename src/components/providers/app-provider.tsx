"use client";

import { ReactNode, useMemo } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";

import { ToastProvider } from "@/components/ui/toast-provider";
import { PwaProvider } from "@/components/providers/pwa-provider";
import { AppThemeProvider } from "@/components/providers/theme-provider";
import { makeStore } from "@/store";

export function AppProvider({
	children,
}: {
	children: ReactNode;
}) {
	const store = useMemo(() => makeStore(), []);
	const persistor = useMemo(
		() => persistStore(store),
		[store],
	);

	return (
		<AppThemeProvider>
			<Provider store={store}>
				<PersistGate loading={null} persistor={persistor}>
					<PwaProvider />
					{children}
					<ToastProvider />
				</PersistGate>
			</Provider>
		</AppThemeProvider>
	);
}
