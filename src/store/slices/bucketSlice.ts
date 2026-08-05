import {
	createSlice,
	createAsyncThunk,
	isAnyOf,
} from "@reduxjs/toolkit";
import { bucketsApi } from "@/lib/api/buckets";
import { setActiveBucketId } from "@/store/slices/uiSlice";
import type { RootState } from "@/store";
import type { BucketSummary } from "@/types/bucket.types";

type BucketState = {
	buckets: BucketSummary[];
	invitations: BucketSummary[];
	loading: boolean;
	error: string | null;
};

const initialState: BucketState = {
	buckets: [],
	invitations: [],
	loading: false,
	error: null,
};

export const fetchBuckets = createAsyncThunk(
	"buckets/fetchList",
	async (_, { dispatch, getState }) => {
		const data = await bucketsApi.fetchBuckets();
		const { activeBucketId } = (getState() as RootState).ui;
		const stale =
			activeBucketId !== null &&
			!data.items.some((b) => b._id === activeBucketId);
		if ((!activeBucketId || stale) && data.items.length > 0) {
			const personal =
				data.items.find((b) => b.isPersonal) ??
				data.items[0];
			if (personal) {
				dispatch(setActiveBucketId(personal._id));
			}
		}
		return data;
	},
);

export const fetchInvitations = createAsyncThunk(
	"buckets/fetchInvitations",
	async () => {
		const data = await bucketsApi.fetchBuckets();
		return data.invitations;
	},
);

export const createBucket = createAsyncThunk(
	"buckets/create",
	async (
		payload: { name: string; icon?: string },
		{ dispatch },
	) => {
		const bucket = await bucketsApi.createBucket(payload);
		dispatch(fetchBuckets());
		return bucket;
	},
);

export const updateBucket = createAsyncThunk(
	"buckets/update",
	async (
		payload: { id: string; name: string; icon?: string },
		{ dispatch },
	) => {
		const bucket = await bucketsApi.updateBucket(payload.id, {
			name: payload.name,
			icon: payload.icon,
		});
		dispatch(fetchBuckets());
		return bucket;
	},
);

export const deleteBucket = createAsyncThunk(
	"buckets/delete",
	async (id: string, { dispatch }) => {
		const result = await bucketsApi.deleteBucket(id);
		dispatch(fetchBuckets());
		return result;
	},
);

export const inviteUser = createAsyncThunk(
	"buckets/invite",
	async (
		payload: { id: string; username: string },
		{ dispatch },
	) => {
		const bucket = await bucketsApi.inviteUser(
			payload.id,
			{ username: payload.username },
		);
		dispatch(fetchBuckets());
		return bucket;
	},
);

export const acceptInvite = createAsyncThunk(
	"buckets/acceptInvite",
	async (id: string, { dispatch }) => {
		const bucket = await bucketsApi.acceptInvite(id);
		dispatch(fetchBuckets());
		return bucket;
	},
);

export const declineInvite = createAsyncThunk(
	"buckets/declineInvite",
	async (id: string, { dispatch }) => {
		const result = await bucketsApi.declineInvite(id);
		dispatch(fetchInvitations());
		return result;
	},
);

export const leaveBucket = createAsyncThunk(
	"buckets/leave",
	async (id: string, { dispatch }) => {
		const result = await bucketsApi.leaveBucket(id);
		dispatch(fetchBuckets());
		return result;
	},
);

export const revokeInvite = createAsyncThunk(
	"buckets/revokeInvite",
	async (
		payload: { id: string; userId: string },
		{ dispatch },
	) => {
		const bucket = await bucketsApi.revokeInvite(
			payload.id,
			payload.userId,
		);
		dispatch(fetchBuckets());
		return bucket;
	},
);

const bucketThunks = [
	fetchBuckets,
	fetchInvitations,
	createBucket,
	updateBucket,
	deleteBucket,
	inviteUser,
	acceptInvite,
	declineInvite,
	leaveBucket,
	revokeInvite,
];

const bucketSlice = createSlice({
	name: "buckets",
	initialState,
	reducers: {
		clearBucketError(state) {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchBuckets.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchBuckets.fulfilled, (state, action) => {
				state.loading = false;
				state.buckets = action.payload.items;
				state.invitations = action.payload.invitations;
			})
			.addCase(fetchInvitations.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(
				fetchInvitations.fulfilled,
				(state, action) => {
					state.loading = false;
					state.invitations = action.payload;
				},
			)
			.addMatcher(
				isAnyOf(...bucketThunks.map((t) => t.rejected)),
				(state, action) => {
					state.loading = false;
					state.error =
						action.error.message ??
						"Failed to fetch buckets";
				},
			);
	},
});

export const { clearBucketError } = bucketSlice.actions;
export default bucketSlice.reducer;
