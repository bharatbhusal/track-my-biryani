"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { analyticsApi } from "@/lib/api/analytics";
import { useSettingsMutations } from "@/hooks/api/use-analytics-api";
import {
	useAuthActions,
	useAuthMe,
} from "@/hooks/api/use-auth-api";
import { useUIStore } from "@/store/ui-store";
import { ActivityList } from "@/features/logs/components/activity-list";

const schema = z.object({
	theme: z.enum(["light", "dark", "system"]),
	hapticFeedback: z.boolean(),
	currentPassword: z.string().optional(),
	newPassword: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function SettingsModal() {
	const hapticFeedback = useUIStore(
		(state) => state.hapticFeedback,
	);
	const settingsSection = useUIStore(
		(state) => state.settingsSection,
	);
	const setSettingsSection = useUIStore(
		(state) => state.setSettingsSection,
	);

	const { setTheme } = useTheme();
	const authQuery = useAuthMe();
	const { logout } = useAuthActions();
	const { updateSettings } = useSettingsMutations();

	const sectionTitle = useMemo(() => {
		if (settingsSection === "security")
			return "Security & Privacy";
		if (settingsSection === "data") return "Export / Import";
		if (settingsSection === "appearance") return "Appearance";
		if (settingsSection === "logs") return "Logs";
		return "";
	}, [settingsSection]);

	const {
		register,
		handleSubmit,
		control,
		formState: { isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
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
		toast.success("Settings updated");
	};

	const handleExportDownload = async (
		type?: "all" | "expenses" | "categories" | "logs",
	) => {
		try {
			const payload =
				type === "all"
					? await analyticsApi.exportData(type)
					: await fetch(
							`/api/export?format=json&type=${type}`,
						).then((r) => r.json());
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

	return (
		<Modal
			open={Boolean(settingsSection)}
			onClose={() => setSettingsSection(null)}
			title={sectionTitle}
		>
			<form
				className="space-y-3"
				onSubmit={handleSubmit(onSubmit)}
			>
				{settingsSection === "appearance" && (
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

				{settingsSection === "security" && (
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

				{settingsSection === "data" && (
					<div className="space-y-2">
						<div className="grid grid-cols-1 gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => void handleExportDownload("all")}
							>
								Export All
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() =>
									void handleExportDownload("expenses")
								}
							>
								Export Expenses
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() =>
									void handleExportDownload("categories")
								}
							>
								Export Categories
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() =>
									void handleExportDownload("logs")
								}
							>
								Export Logs
							</Button>
						</div>
					</div>
				)}

				{settingsSection === "logs" && <ActivityList />}

				{settingsSection !== "data" &&
					settingsSection !== "logs" && (
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
	);
}
