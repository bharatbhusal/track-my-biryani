"use client";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useUIStore } from "@/store/ui-store";

export function SettingsForm() {
	const setSettingsSection = useUIStore(
		(state) => state.setSettingsSection,
	);

	return (
		<Card>
			<CardTitle className="mb-4">Settings</CardTitle>
			<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
				<Button
					variant="outline"
					onClick={() => setSettingsSection("security")}
				>
					Security & Privacy
				</Button>
				<Button
					variant="outline"
					onClick={() => setSettingsSection("data")}
				>
					Export / Import
				</Button>
				<Button
					variant="outline"
					onClick={() => setSettingsSection("appearance")}
				>
					Appearance
				</Button>
				<Button
					variant="outline"
					onClick={() => setSettingsSection("logs")}
				>
					Logs
				</Button>
			</div>
		</Card>
	);
}
