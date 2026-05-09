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

const schema = z.object({
	theme: z.enum(["light", "dark", "system"]),
	hapticFeedback: z.boolean(),
	currentPassword: z.string().optional(),
	newPassword: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function SettingsForm() {
	const hapticFeedback = useUIStore(
		(state) => state.hapticFeedback,
	);
	const { setTheme } = useTheme();
	const authQuery = useAuthMe();
	const { logout } = useAuthActions();
	const { updateSettings } = useSettingsMutations();
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
			const payload = await analyticsApi.exportData(type);
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
		<>
			<Card>
				<CardTitle className="mb-4">Settings</CardTitle>
				<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
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
							<div className="grid grid-cols-1 gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => void handleExportDownload("all")}
								>
									Export All (JSON)
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={async () => {
										// export expenses only
										try {
											const payload = await fetch(
												`/api/export?format=json&type=expenses`,
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
									}}
								>
									Export Expenses (JSON)
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={async () => {
										try {
											const payload = await fetch(
												`/api/export?format=json&type=categories`,
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
									}}
								>
									Export Categories (JSON)
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={async () => {
										try {
											const payload = await fetch(
												`/api/export?format=json&type=logs`,
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
									}}
								>
									Export Logs (JSON)
								</Button>
							</div>
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
