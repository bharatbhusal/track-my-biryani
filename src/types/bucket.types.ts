export type BucketRole = "owner" | "member";
export type BucketStatus = "pending" | "accepted";

export type BucketMember = {
	userId: string;
	role: BucketRole;
	status: BucketStatus;
	invitedBy?: string;
	invitedAt?: string;
	joinedAt?: string;
};

export type BucketMemberWithName = BucketMember & {
	name: string;
	username?: string;
};

export type BucketSummary = {
	_id: string;
	name: string;
	icon?: string;
	ownerId: string;
	isPersonal?: boolean;
	memberCount: number;
	totalAmount?: number;
	createdAt?: string;
	role: BucketRole;
	status: BucketStatus;
};

export type BucketsListPayload = {
	items: BucketSummary[];
	invitations: BucketSummary[];
};

export type BucketDetail = {
	_id: string;
	name: string;
	icon?: string;
	ownerId: string;
	isPersonal?: boolean;
	memberCount: number;
	members: BucketMemberWithName[];
	createdAt?: string;
	updatedAt?: string;
};
