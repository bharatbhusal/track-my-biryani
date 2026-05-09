import { SettingsForm } from "@/features/settings/components/settings-form";

export const metadata = {
	title: "Settings",
};

export default function SettingsPage() {
	return (
		<section className="space-y-4 py-4">
			<SettingsForm />
		</section>
	);
}
