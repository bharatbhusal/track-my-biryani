"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { analyticsApi } from "@/lib/api/analytics";
import { useSettingsMutations } from "@/hooks/api/use-analytics-api";
import {
	useAuthActions,
	useAuthMe,
} from "@/hooks/api/use-auth-api";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CURRENCY_CODE_REGEX } from "@/lib/validation-constants";
import { useUIStore } from "@/store/ui-store";
import { ActivityList } from "@/features/logs/components/activity-list";

type SettingsSection =
	| "preferences"
	| "security"
	| "data"
	| "appearance"
	| "notifications"
	| "logs"
	| null;

const TIMEZONES = [
	"UTC",
	"Asia/Kolkata",
	"America/New_York",
	"Europe/London",
	"Asia/Tokyo",
	"Australia/Sydney",
];

const LOCALES = [
	"en-US",
	"en-IN",
	"en-GB",
	"fr-FR",
	"de-DE",
	"ja-JP",
];
const CURRENCIES = [
	"USD",
	"INR",
	"EUR",
	"GBP",
	"JPY",
	"AUD",
];

const schema = z.object({
	locale: z.string().min(2),
	currency: z.string().regex(CURRENCY_CODE_REGEX),
	timezone: z.string().min(3),
	theme: z.enum(["light", "dark", "system"]),
	hapticFeedback: z.boolean(),
	currentPassword: z.string().optional(),
	newPassword: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function SettingsForm() {
	const locale = useUIStore((state) => state.locale);
	const currency = useUIStore((state) => state.currency);
	const timezone = useUIStore((state) => state.timezone);
	const hapticFeedback = useUIStore(
		(state) => state.hapticFeedback,
	);
	const setPreferences = useUIStore(
		(state) => state.setPreferences,
	);
	const { setTheme } = useTheme();
	const authQuery = useAuthMe();
	const { logout } = useAuthActions();
	const { updateSettings, importData: importDataMutation } =
		useSettingsMutations();
	const [activeSection, setActiveSection] =
		useState<SettingsSection>(null);

	const sectionTitle = useMemo(() => {
		if (activeSection === "preferences")
			return "User Preferences";
		if (activeSection === "security")
			return "Security & Privacy";
		if (activeSection === "data") return "Export / Import";
		if (activeSection === "appearance") return "Appearance";
		if (activeSection === "notifications")
			return "Notifications / Haptics";
		if (activeSection === "logs") return "Logs";
		return "";
	}, [activeSection]);

	const {
		register,
		handleSubmit,
		control,
		formState: { isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			locale,
			currency,
			timezone,
			theme: "system",
			hapticFeedback,
			currentPassword: "",
			newPassword: "",
		},
	});

	const currentTheme = useWatch({
		control,
		name: "theme",
	}) as FormValues["theme"];

	const onSubmit = async (values: FormValues) => {
		try {
			await updateSettings.mutateAsync({
				locale: values.locale,
				currency: values.currency.toUpperCase(),
				timezone: values.timezone,
				theme: values.theme,
				hapticFeedback: values.hapticFeedback,
				password:
					values.currentPassword && values.newPassword
						? {
								currentPassword: values.currentPassword,
								newPassword: values.newPassword,
							}
						: undefined,
			});
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to update settings",
			);
			return;
		}

		setTheme(values.theme);
		setPreferences({
			locale: values.locale,
			currency: values.currency.toUpperCase(),
			timezone: values.timezone,
			hapticFeedback: values.hapticFeedback,
		});
		toast.success("Settings updated");
	};

	const handleExportDownload = async (
		format: "json" | "csv",
	) => {
		try {
			const payload = await analyticsApi.exportData(format);
			const blob = new Blob([payload.data], {
				type: payload.mimeType,
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = payload.filename;
			link.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Export failed",
			);
		}
	};

	const importData = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const text = await file.text();
		try {
			await importDataMutation.mutateAsync(JSON.parse(text));
			toast.success("Import completed");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Import failed",
			);
		}
	};

	return (
		<>
			<Card>
				<CardTitle className="mb-4">Settings</CardTitle>
				<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
					<Button
						variant="outline"
						onClick={() => setActiveSection("preferences")}
					>
						User Preferences
					</Button>
					<Button
						variant="outline"
						onClick={() => setActiveSection("security")}
					>
						Security & Privacy
					</Button>
					<Button
						variant="outline"
						onClick={() => setActiveSection("data")}
					>
						Export / Import
					</Button>
					<Button
						variant="outline"
						onClick={() => setActiveSection("appearance")}
					>
						Appearance
					</Button>
					<Button
						variant="outline"
						onClick={() => setActiveSection("notifications")}
					>
						Notifications / Haptics
					</Button>
					<Button
						variant="outline"
						onClick={() => setActiveSection("logs")}
					>
						Logs
					</Button>
				</div>
			</Card>

			<Modal
				open={Boolean(activeSection)}
				onClose={() => setActiveSection(null)}
				title={sectionTitle}
			>
				<form
					className="space-y-3"
					onSubmit={handleSubmit(onSubmit)}
				>
					{activeSection === "preferences" && (
						<>
							<label className="block text-sm">
								<span>Locale</span>
								<Input
									list="locale-options"
									{...register("locale")}
								/>
								<datalist id="locale-options">
									{LOCALES.map((item) => (
										<option key={item} value={item} />
									))}
								</datalist>
							</label>
							<label className="block text-sm">
								<span>Currency</span>
								<Input
									list="currency-options"
									{...register("currency")}
								/>
								<datalist id="currency-options">
									{CURRENCIES.map((item) => (
										<option key={item} value={item} />
									))}
								</datalist>
							</label>
							<label className="block text-sm">
								<span>Timezone</span>
								<Input
									list="timezone-options"
									{...register("timezone")}
								/>
								<datalist id="timezone-options">
									{TIMEZONES.map((item) => (
										<option key={item} value={item} />
									))}
								</datalist>
							</label>
						</>
					)}

					{activeSection === "appearance" && (
						<label className="block text-sm">
							<span>Theme</span>
							<Select {...register("theme")}>
								<option value="system">System</option>
								<option value="light">Light</option>
								<option value="dark">Dark</option>
							</Select>
							<p className="mt-1 text-xs text-[var(--color-muted)]">
								Current: {currentTheme}
							</p>
						</label>
					)}

					{activeSection === "notifications" && (
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								{...register("hapticFeedback")}
							/>
							<span>Enable haptic feedback</span>
						</label>
					)}

					{activeSection === "security" && (
						<>
							<Input
								type="password"
								{...register("currentPassword")}
								placeholder="Current password"
							/>
							<Input
								type="password"
								{...register("newPassword")}
								placeholder="New password"
							/>
							{authQuery.data && (
								<Button
									type="button"
									variant="destructive"
									onClick={async () => {
										try {
											await logout.mutateAsync();
											toast.success("Logged out");
										} catch (error) {
											toast.error(
												error instanceof Error
													? error.message
													: "Logout failed",
											);
										}
									}}
								>
									Logout
								</Button>
							)}
						</>
					)}

					{activeSection === "data" && (
						<div className="space-y-2">
							<div className="grid grid-cols-2 gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => void handleExportDownload("json")}
								>
									Export JSON
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => void handleExportDownload("csv")}
								>
									Export CSV
								</Button>
							</div>
							<label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium">
								Import JSON
								<input
									type="file"
									accept="application/json"
									className="hidden"
									onChange={importData}
								/>
							</label>
						</div>
					)}

					{activeSection === "logs" && <ActivityList />}

					{activeSection !== "data" &&
						activeSection !== "logs" && (
							<Button
								type="submit"
								className="w-full"
								disabled={isSubmitting}
							>
								Save changes
							</Button>
						)}
				</form>
			</Modal>
		</>
	);
}
