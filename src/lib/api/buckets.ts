import { apiRequest } from "@/lib/api/client";
import type {
	BucketDetail,
	BucketsListPayload,
	BucketSummary,
} from "@/types/bucket.types";

export type MigrationResult = {
	migratedCategories: number;
	migratedExpenses: number;
};

export const bucketsApi = {
	fetchBuckets: () =>
		apiRequest<BucketsListPayload>("/buckets"),
	createBucket: (payload: { name: string; icon?: string }) =>
		apiRequest<BucketDetail>("/buckets", {
			method: "POST",
			body: payload,
		}),
	getBucket: (id: string) =>
		apiRequest<BucketDetail>(`/buckets/${encodeURIComponent(id)}`),
	updateBucket: (
		id: string,
		payload: { name: string; icon?: string },
	) =>
		apiRequest<BucketDetail>(`/buckets/${encodeURIComponent(id)}`, {
			method: "PATCH",
			body: payload,
		}),
	deleteBucket: (id: string) =>
		apiRequest<{ message: string }>(
			`/buckets/${encodeURIComponent(id)}`,
			{ method: "DELETE" },
		),
	inviteUser: (id: string, payload: { username: string }) =>
		apiRequest<BucketDetail>(
			`/buckets/${encodeURIComponent(id)}/invite`,
			{ method: "POST", body: payload },
		),
	acceptInvite: (id: string) =>
		apiRequest<BucketDetail>(
			`/buckets/${encodeURIComponent(id)}/accept`,
			{ method: "POST" },
		),
	declineInvite: (id: string) =>
		apiRequest<BucketSummary>(
			`/buckets/${encodeURIComponent(id)}/decline`,
			{ method: "POST" },
		),
	leaveBucket: (id: string) =>
		apiRequest<{ message: string }>(
			`/buckets/${encodeURIComponent(id)}/leave`,
			{ method: "POST" },
		),
	revokeInvite: (id: string, userId: string) =>
		apiRequest<BucketDetail>(
			`/buckets/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`,
			{ method: "DELETE" },
		),
	runMigration: () =>
		apiRequest<MigrationResult>("/settings/migrate", {
			method: "POST",
		}),
};
