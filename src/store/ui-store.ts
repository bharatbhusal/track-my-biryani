import { create } from "zustand";

import {
	DEFAULT_GLOBAL_RANGE,
	type GlobalDateRange,
} from "@/lib/date-range";

type UIState = {
	quickAddOpen: boolean;
	globalDateRange: GlobalDateRange;
	customRangeModalOpen: boolean;
	locale: string;
	currency: string;
	timezone: string;
	hapticFeedback: boolean;
	detectionCompleted: boolean;
	setQuickAddOpen: (value: boolean) => void;
	setGlobalDateRange: (input: GlobalDateRange) => void;
	setCustomRangeModalOpen: (value: boolean) => void;
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
	globalDateRange: DEFAULT_GLOBAL_RANGE,
	customRangeModalOpen: false,
	locale: "en-US",
	currency: "INR",
	timezone: "Asia/Kolkata",
	hapticFeedback: true,
	detectionCompleted: false,
	setQuickAddOpen: (value) => set({ quickAddOpen: value }),
	setGlobalDateRange: (input) =>
		set({ globalDateRange: input }),
	setCustomRangeModalOpen: (value) =>
		set({ customRangeModalOpen: value }),
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
