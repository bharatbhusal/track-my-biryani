export type BucketRole = "owner" | "member";
export type BucketStatus = "pending" | "accepted";

export type BucketMember = {
  userId: string;
  role: BucketRole;
  status: BucketStatus;
  upiId?: string;
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
  ownerName?: string;
  isPersonal?: boolean;
  memberCount: number;
  totalAmount?: number;
  expenseCount?: number;
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
  ownerName?: string;
  isPersonal?: boolean;
  memberCount: number;
  totalAmount?: number;
  expenseCount?: number;
  role?: BucketRole;
  status?: BucketStatus;
  members: BucketMemberWithName[];
  createdAt?: string;
  updatedAt?: string;
};

export type BucketPreview = {
  _id: string;
  name: string;
  icon?: string;
  ownerId: string;
  ownerName?: string;
  isPersonal?: boolean;
  memberCount: number;
  role?: BucketRole;
  status?: BucketStatus;
};

export type MemberShare = {
  memberId: string;
  memberName: string;
  percentage: number;
  owedAmount: number;
  paidAmount: number;
  netBalance: number;
};

export type BucketSharesSummary = {
  totalOwed: number;
  allMembersPaid: boolean;
  individualShares: MemberShare[];
};

export type IncomingRequestUser = {
  userId: string;
  name: string;
  username?: string;
  invitedAt?: string;
};

export type IncomingRequestsGroup = {
  bucketId: string;
  name: string;
  icon?: string;
  requests: IncomingRequestUser[];
};
