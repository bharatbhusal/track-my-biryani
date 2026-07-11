import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { analyticsApi } from "@/lib/api/analytics";
import type { DashboardAnalytics } from "@/types/analytics.types";

type DashboardState = {
	data: DashboardAnalytics | null;
	loading: boolean;
	error: string | null;
};

const initialState: DashboardState = {
	data: null,
	loading: false,
	error: null,
};

export const fetchDashboard = createAsyncThunk(
	"dashboard/fetch",
	async (params?: {
		preset?: string;
		from?: string;
		to?: string;
		categoryId?: string;
	}) => {
		return analyticsApi.dashboard(params);
	},
);

const dashboardSlice = createSlice({
	name: "dashboard",
	initialState,
	reducers: {
		clearDashboardError(state) {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchDashboard.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchDashboard.fulfilled, (state, action) => {
				state.loading = false;
				state.data = action.payload;
			})
			.addCase(fetchDashboard.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message ?? "Failed to fetch dashboard";
			});
	},
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
