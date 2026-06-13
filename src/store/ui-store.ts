import { create } from "zustand";

type UIState = {
	quickAddOpen: boolean;
	locale: string;
	currency: string;
	timezone: string;
	detectionCompleted: boolean;
	setQuickAddOpen: (value: boolean) => void;
	setPreferences: (input: {
		locale: string;
		currency: string;
		timezone: string;
		detectionCompleted?: boolean;
	}) => void;
};

export const useUIStore = create<UIState>()((set) => ({
	quickAddOpen: false,
	locale: "en-IN",
	currency: "INR",
	timezone: "Asia/Kolkata",
	detectionCompleted: false,
	setQuickAddOpen: (value) => set({ quickAddOpen: value }),
	setPreferences: ({
		locale,
		currency,
		timezone,
		detectionCompleted,
	}) =>
		set({
			locale,
			currency,
			timezone,
			detectionCompleted: detectionCompleted ?? true,
		}),
}));
