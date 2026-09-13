import { createSlice, createAsyncThunk, isAnyOf } from "@reduxjs/toolkit";
import { bucketsApi } from "@/lib/api/buckets";
import { sortForVariant } from "@/components/filters/variants";
import { bucketCriteria } from "@/lib/filters";
import type { RootState } from "@/store";
import type {
  BucketBalances,
  BucketDetail,
  BucketSummary,
  IncomingRequestsGroup,
  SettlementItem,
} from "@/constants/types/bucket.types";

type BucketState = {
  buckets: BucketSummary[];
  allBuckets: BucketSummary[];
  invitations: BucketSummary[];
  incomingRequests: IncomingRequestsGroup[];
  currentBucket: BucketDetail | null;
  balances: BucketBalances | null;
  settlements: SettlementItem[];
  loading: boolean;
  error: string | null;
};

const initialState: BucketState = {
  buckets: [],
  allBuckets: [],
  invitations: [],
  incomingRequests: [],
  currentBucket: null,
  balances: null,
  settlements: [],
  loading: false,
  error: null,
};

export const fetchBuckets = createAsyncThunk("buckets/search", async (_, { getState }) => {
  const state = getState() as RootState;
  const v = state.filters.buckets;
  const result = await bucketsApi.searchBuckets({
    filterCriteria: bucketCriteria(v.filterCriteria, "buckets"),
    sortCriteria: sortForVariant("buckets", v.sortCriteria),
    pagination: v.pagination,
  });
  return result.items;
});

export const fetchAllBuckets = createAsyncThunk("buckets/searchAll", () =>
  bucketsApi
    .searchBuckets({
      filterCriteria: { date: { preset: "THIS_MONTH" } },
      sortCriteria: { field: "createdAt", direction: "DESC" },
      pagination: { page: 1, pageSize: 100 },
    })
    .then((r) => r.items),
);

export const fetchBucketDetail = createAsyncThunk(
  "buckets/fetchDetail",
  async (id: string, { getState }) => {
    const state = getState() as RootState;
    const fc = (state.filters as any).bucket?.filterCriteria;
    return bucketsApi.getBucketStats(id, fc);
  },
);

export const fetchInvitations = createAsyncThunk("buckets/fetchInvitations", () =>
  bucketsApi
    .searchBuckets({
      filterCriteria: { date: { preset: "THIS_MONTH" } },
      sortCriteria: { field: "createdAt", direction: "DESC" },
      pagination: { page: 1, pageSize: 100 },
    })
    .then((r) => r.items.filter((b) => b.status === "pending")),
);

export const createBucket = createAsyncThunk(
  "buckets/create",
  async (payload: { name: string; icon?: string }, { dispatch }) => {
    const bucket = await bucketsApi.createBucket(payload);
    dispatch(fetchBuckets());
    return bucket;
  },
);

export const updateBucket = createAsyncThunk(
  "buckets/update",
  async (payload: { id: string; name: string; icon?: string }, { dispatch }) => {
    const bucket = await bucketsApi.updateBucket(payload.id, {
      name: payload.name,
      icon: payload.icon,
    });
    dispatch(fetchBuckets());
    return bucket;
  },
);

export const deleteBucket = createAsyncThunk("buckets/delete", async (id: string, { dispatch }) => {
  const result = await bucketsApi.deleteBucket(id);
  dispatch(fetchBuckets());
  return result;
});

export const inviteUser = createAsyncThunk(
  "buckets/invite",
  async (payload: { id: string; username: string }, { dispatch }) => {
    const bucket = await bucketsApi.inviteUser(payload.id, {
      username: payload.username,
    });
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

export const leaveBucket = createAsyncThunk("buckets/leave", async (id: string, { dispatch }) => {
  const result = await bucketsApi.leaveBucket(id);
  dispatch(fetchBuckets());
  return result;
});

export const revokeInvite = createAsyncThunk(
  "buckets/revokeInvite",
  async (payload: { id: string; userId: string }, { dispatch }) => {
    const bucket = await bucketsApi.revokeInvite(payload.id, payload.userId);
    dispatch(fetchBuckets());
    return bucket;
  },
);

export const fetchIncomingRequests = createAsyncThunk("buckets/fetchIncomingRequests", async () =>
  bucketsApi.getIncomingRequests(),
);

export const acceptIncomingRequest = createAsyncThunk(
  "buckets/acceptIncomingRequest",
  async (payload: { id: string; userId: string }, { dispatch }) => {
    const bucket = await bucketsApi.acceptRequest(payload.id, payload.userId);
    dispatch(fetchIncomingRequests());
    dispatch(fetchBuckets());
    return bucket;
  },
);

export const declineIncomingRequest = createAsyncThunk(
  "buckets/declineIncomingRequest",
  async (payload: { id: string; userId: string }, { dispatch }) => {
    const bucket = await bucketsApi.revokeInvite(payload.id, payload.userId);
    dispatch(fetchIncomingRequests());
    return bucket;
  },
);

export const fetchBucketBalances = createAsyncThunk("buckets/fetchBalances", (id: string) =>
  bucketsApi.getMemberBalances(id),
);

export const fetchBucketSettlements = createAsyncThunk("buckets/fetchSettlements", (id: string) =>
  bucketsApi.getSettlements(id),
);

export const confirmSettlement = createAsyncThunk(
  "buckets/confirmSettlement",
  async (payload: { id: string; fromUserId: string; note?: string }, { dispatch }) => {
    const settlement = await bucketsApi.confirmSettlement(payload.id, {
      fromUserId: payload.fromUserId,
      note: payload.note,
    });
    dispatch(fetchBucketBalances(payload.id));
    dispatch(fetchBucketSettlements(payload.id));
    return settlement;
  },
);

export const closeBucket = createAsyncThunk("buckets/close", async (id: string, { dispatch }) => {
  const result = await bucketsApi.closeBucket(id);
  dispatch(fetchAllBuckets());
  dispatch(fetchBucketDetail(id));
  return result;
});

export const updateMemberUpiId = createAsyncThunk(
  "buckets/updateMemberUpiId",
  async (payload: { id: string; upiId: string }, { dispatch }) => {
    const bucket = await bucketsApi.updateMemberUpiId(payload.id, payload.upiId);
    dispatch(fetchBucketBalances(payload.id));
    dispatch(fetchBucketDetail(payload.id));
    return bucket;
  },
);

export const setBucketShares = createAsyncThunk(
  "buckets/setShares",
  async (payload: { id: string; shares: Record<string, number> }, { dispatch }) => {
    const bucket = await bucketsApi.setMemberShares(payload.id, { shares: payload.shares });
    dispatch(fetchBucketBalances(payload.id));
    dispatch(fetchBucketDetail(payload.id));
    return bucket;
  },
);

const bucketThunks = [
  fetchBuckets,
  fetchInvitations,
  fetchBucketDetail,
  createBucket,
  updateBucket,
  deleteBucket,
  inviteUser,
  acceptInvite,
  declineInvite,
  leaveBucket,
  revokeInvite,
  fetchIncomingRequests,
  acceptIncomingRequest,
  declineIncomingRequest,
  fetchBucketBalances,
  fetchBucketSettlements,
  confirmSettlement,
  closeBucket,
  updateMemberUpiId,
  setBucketShares,
];

const bucketSlice = createSlice({
  name: "buckets",
  initialState,
  reducers: {
    clearBucketError(state) {
      state.error = null;
    },
    resetBucketDetail(state) {
      state.currentBucket = null;
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
        const items = action.payload;
        state.buckets = items.filter((b) => b.status === "accepted");
        state.invitations = items.filter((b) => b.status === "pending");
      })
      .addCase(fetchAllBuckets.fulfilled, (state, action) => {
        state.allBuckets = action.payload.filter((b) => b.status === "accepted");
        state.invitations = action.payload.filter((b) => b.status === "pending");
      })
      .addCase(fetchInvitations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvitations.fulfilled, (state, action) => {
        state.loading = false;
        state.invitations = action.payload;
      })
      .addCase(fetchBucketDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBucketDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBucket = action.payload;
      })
      .addCase(fetchIncomingRequests.fulfilled, (state, action) => {
        state.incomingRequests = action.payload;
      })
      .addCase(fetchBucketBalances.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchBucketBalances.fulfilled, (state, action) => {
        state.balances = action.payload;
      })
      .addCase(fetchBucketSettlements.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchBucketSettlements.fulfilled, (state, action) => {
        state.settlements = action.payload;
      })
      .addCase(confirmSettlement.pending, (state) => {
        state.error = null;
      })
      .addCase(closeBucket.pending, (state) => {
        state.error = null;
      })
      .addCase(setBucketShares.pending, (state) => {
        state.error = null;
      })
      .addMatcher(isAnyOf(...bucketThunks.map((t) => t.rejected)), (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch buckets";
      });
  },
});

export const { clearBucketError, resetBucketDetail } = bucketSlice.actions;
export default bucketSlice.reducer;
