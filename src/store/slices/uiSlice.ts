import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { GlobalDateRange } from "@/lib/date-range";
import { DEFAULT_GLOBAL_RANGE } from "@/lib/date-range";

type LocationPermission = "granted" | "denied" | "prompt";

type UIState = {
	quickAddOpen: boolean;
	locale: string;
	currency: string;
	timezone: string;
	detectionCompleted: boolean;
	dateRange: GlobalDateRange;
	locationPermission: LocationPermission;
	draftExpense: Partial<{
		title: string;
		amount: number | undefined;
		categoryId: string;
		paidAt: string;
	}> | null;
};

const initialState: UIState = {
	quickAddOpen: false,
	locale: "en-IN",
	currency: "INR",
	timezone: "Asia/Kolkata",
	detectionCompleted: false,
	dateRange: DEFAULT_GLOBAL_RANGE,
	locationPermission: "prompt",
	draftExpense: null,
};

const uiSlice = createSlice({
	name: "ui",
	initialState,
	reducers: {
		setQuickAddOpen(state, action: PayloadAction<boolean>) {
			state.quickAddOpen = action.payload;
		},
		setPreferences(
			state,
			action: PayloadAction<{
				locale: string;
				currency: string;
				timezone: string;
				detectionCompleted?: boolean;
			}>,
		) {
			state.locale = action.payload.locale;
			state.currency = action.payload.currency;
			state.timezone = action.payload.timezone;
			state.detectionCompleted = action.payload.detectionCompleted ?? true;
		},
		setDateRange(state, action: PayloadAction<GlobalDateRange>) {
			state.dateRange = action.payload;
		},
		setLocationPermission(state, action: PayloadAction<LocationPermission>) {
			state.locationPermission = action.payload;
		},
		setDraftExpense(
			state,
			action: PayloadAction<Partial<{
				title: string;
				amount: number | undefined;
				categoryId: string;
				paidAt: string;
			}> | null>,
		) {
			state.draftExpense = action.payload;
		},
		clearDraftExpense(state) {
			state.draftExpense = null;
		},
	},
});

export const {
	setQuickAddOpen,
	setPreferences,
	setDateRange,
	setLocationPermission,
	setDraftExpense,
	clearDraftExpense,
} = uiSlice.actions;
export default uiSlice.reducer;
export type { LocationPermission };