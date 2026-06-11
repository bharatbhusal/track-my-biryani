import { create } from "zustand";

// date range state moved to per-component context

export type SettingsSection =
	| "security"
	| "data"
	| "appearance"
	| "logs"
	| null;

type UIState = {
	quickAddOpen: boolean;
	customRangeModalOpen: boolean;
	settingsSection: SettingsSection;
	locale: string;
	currency: string;
	timezone: string;
	hapticFeedback: boolean;
	detectionCompleted: boolean;
	setQuickAddOpen: (value: boolean) => void;
	setCustomRangeModalOpen: (value: boolean) => void;
	setSettingsSection: (section: SettingsSection) => void;
	setPreferences: (input: {
		locale: string;
		currency: string;
		timezone: string;
		hapticFeedback: boolean;
		detectionCompleted?: boolean;
	}) => void;
};

export const useUIStore = create<UIState>()((set) => ({
	quickAddOpen: false,
	customRangeModalOpen: false,
	settingsSection: null,
	locale: "en-US",
	currency: "INR",
	timezone: "Asia/Kolkata",
	hapticFeedback: true,
	detectionCompleted: false,
	setQuickAddOpen: (value) => set({ quickAddOpen: value }),
	setCustomRangeModalOpen: (value) =>
		set({ customRangeModalOpen: value }),
	setSettingsSection: (section) =>
		set({ settingsSection: section }),
	setPreferences: ({
		locale,
		currency,
		timezone,
		hapticFeedback,
		detectionCompleted,
	}) =>
		set({
			locale,
			currency,
			timezone,
			hapticFeedback,
			detectionCompleted: detectionCompleted ?? true,
		}),
}));
