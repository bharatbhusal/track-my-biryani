import { create } from "zustand";

type UIState = {
	quickAddOpen: boolean;
	locale: string;
	currency: string;
	timezone: string;
	hapticFeedback: boolean;
	detectionCompleted: boolean;
	setQuickAddOpen: (value: boolean) => void;
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
	locale: "en-US",
	currency: "INR",
	timezone: "Asia/Kolkata",
	hapticFeedback: true,
	detectionCompleted: true,
	setQuickAddOpen: (value) => set({ quickAddOpen: value }),
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
