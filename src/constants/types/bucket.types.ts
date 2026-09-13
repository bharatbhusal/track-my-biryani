export type BucketRole = "owner" | "member";
export type BucketStatus = "pending" | "accepted";
export type BucketLifecycleStatus = "live" | "settlement-config" | "settlement-live" | "close";

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
  closedAt?: string; // ISO date, present once bucket is closed
  lifecycleStatus?: BucketLifecycleStatus;
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
  closedAt?: string; // ISO date, present once bucket is closed
  lifecycleStatus?: BucketLifecycleStatus;
};

// Minimal bucket shape for action dialogs opened from a card, which only has a
// BucketSummary (no `members`). Dialogs that need member rows fetch balances themselves.
export type BucketDialogBucket = Pick<
  BucketDetail,
  "_id" | "name" | "role" | "closedAt" | "lifecycleStatus"
>;

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
  lifecycleStatus?: BucketLifecycleStatus;
};

export type MemberBalance = {
  memberId: string;
  memberName: string;
  percentage: number;
  owedAmount: number;
  paidAmount: number;
  netBalance: number;
  upiId: string;
};

export type DebtEdge = {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
};

export type BucketBalances = {
  members: MemberBalance[];
  debts: DebtEdge[]; // greedy simplified plan: "from pays to"
  totalExpenses: number;
  allMembersPaid: boolean; // every member's |netBalance| <= 0.01
  closedAt?: string; // ISO date, present once bucket is closed
};

export type SettlementItem = {
  _id: string;
  bucketId: string;
  fromUserId: string;
  toUserId: string;
  fromName?: string;
  toName?: string;
  amount: number;
  note?: string;
  confirmedBy: string;
  confirmedAt: string;
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
