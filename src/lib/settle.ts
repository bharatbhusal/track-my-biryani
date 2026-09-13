/**
 * Settlement math for group expense settle-ups.
 *
 * Domain model: the payer of an expense COVERS its full cost. The cost is then
 * SPLIT among the members eligible at the time it was paid (join-date
 * proration: a member who joined after the expense was paid does not share it;
 * a member without a joinedAt is treated as present from the bucket's
 * creation). Shares, when complete, split each expense proportionally among
 * the eligible members; empty or partial shares fall back to an equal split.
 * Settlements record ALREADY-COMPLETED peer transfers (debtor -> creditor),
 * confirmed by the creditor, so they reduce the debtor's balance.
 *
 * All published amounts are rounded to 2 decimals with `round2`; intermediate
 * math keeps full precision and only published values are rounded. The module
 * is pure: no I/O, no dependencies, deterministic output (every returned
 * collection is sorted).
 */

export type SettleMember = { userId: string; joinedAt?: Date };

export type SettleExpense = { userId: string; amount: number; paidAt: Date };

export type SettleTransfer = { fromUserId: string; toUserId: string; amount: number };

export type MemberBalance = {
  memberId: string;
  owedAmount: number; // their share of eligible expenses
  paidAmount: number; // expenses they covered + received - sent (net credit from transfers)
  netBalance: number; // paidAmount - owedAmount; >0 = they are owed money, <0 = they owe
};

export type DebtEdge = { fromUserId: string; toUserId: string; amount: number }; // debtor -> creditor

export type SettleResult = {
  members: MemberBalance[]; // one per accepted member, sorted by memberId
  debtPlan: DebtEdge[]; // greedy simplified plan
  totalExpenses: number;
  allSettled: boolean; // every |netBalance| <= 0.01
};

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

type Position = { userId: string; amount: number };

/** Sort owed amounts DESC; tie-break by userId ASC so output is deterministic. */
function sortByOwedDesc(a: Position, b: Position): number {
  return b.amount - a.amount || a.userId.localeCompare(b.userId);
}

/** Insert into a list kept sorted by sortByOwedDesc. */
function insertSortedDesc(list: Position[], item: Position): void {
  const index = list.findIndex(
    (entry) =>
      entry.amount < item.amount || (entry.amount === item.amount && entry.userId > item.userId),
  );
  if (index === -1) list.push(item);
  else list.splice(index, 0, item);
}

export function computeSettlement(opts: {
  members: SettleMember[];
  shares: Record<string, number>;
  expenses: SettleExpense[];
  settlements: SettleTransfer[];
  bucketCreatedAt: Date;
}): SettleResult {
  const { members, shares, expenses, settlements, bucketCreatedAt } = opts;

  const joinDate = new Map<string, number>(
    members.map((m) => [m.userId, m.joinedAt?.getTime() ?? bucketCreatedAt.getTime()]),
  );

  // Shares are only authoritative when every member has a positive share;
  // empty or partial shares fall back to an equal split (weight 1 for all).
  const useShares =
    members.length > 0 &&
    members.every((m) => {
      const s = shares[m.userId];
      return typeof s === "number" && Number.isFinite(s) && s > 0;
    });
  const weight = (memberId: string): number => (useShares ? shares[memberId] : 1);

  const totalExpenses = round2(expenses.reduce((sum, e) => sum + e.amount, 0));

  // owed(i): sum over expenses where i was eligible of amount * share(i) / sum(shares of eligibles).
  const owed = new Map<string, number>(members.map((m) => [m.userId, 0]));
  for (const e of expenses) {
    const eligible = members.filter((m) => joinDate.get(m.userId)! <= e.paidAt.getTime());
    if (eligible.length === 0) continue;
    const weightSum = eligible.reduce((sum, m) => sum + weight(m.userId), 0);
    for (const m of eligible) {
      owed.set(m.userId, owed.get(m.userId)! + (e.amount * weight(m.userId)) / weightSum);
    }
  }

  // paid(i): expenses the member covered. Transfers: sent/received.
  const paid = new Map<string, number>(members.map((m) => [m.userId, 0]));
  for (const e of expenses) paid.set(e.userId, (paid.get(e.userId) ?? 0) + e.amount);

  const sent = new Map<string, number>(members.map((m) => [m.userId, 0]));
  const received = new Map<string, number>(members.map((m) => [m.userId, 0]));
  for (const s of settlements) {
    sent.set(s.fromUserId, (sent.get(s.fromUserId) ?? 0) + s.amount);
    received.set(s.toUserId, (received.get(s.toUserId) ?? 0) + s.amount);
  }

  const balances: MemberBalance[] = members
    .map((m) => {
      const owedAmount = round2(owed.get(m.userId)!);
      const paidAmount = round2(
        (paid.get(m.userId) ?? 0) + (received.get(m.userId) ?? 0) - (sent.get(m.userId) ?? 0),
      );
      return {
        memberId: m.userId,
        owedAmount,
        paidAmount,
        netBalance: round2(paidAmount - owedAmount),
      };
    })
    .sort((a, b) => a.memberId.localeCompare(b.memberId));

  // Greedy simplification (Splitwise "Simplify Debts"): repeatedly pair the
  // largest remaining debtor with the largest remaining creditor.
  const debtors: Position[] = [];
  const creditors: Position[] = [];
  for (const b of balances) {
    if (b.netBalance < -0.01) debtors.push({ userId: b.memberId, amount: -b.netBalance });
    else if (b.netBalance > 0.01) creditors.push({ userId: b.memberId, amount: b.netBalance });
  }
  debtors.sort(sortByOwedDesc);
  creditors.sort(sortByOwedDesc);

  const debtPlan: DebtEdge[] = [];
  while (debtors.length > 0 && creditors.length > 0) {
    // The lists keep the largest first: shift both, then re-insert whichever
    // still carries a remainder.
    const debtor = debtors.shift()!;
    const creditor = creditors.shift()!;
    const transfer = Math.min(debtor.amount, creditor.amount);
    debtor.amount -= transfer;
    creditor.amount -= transfer;
    debtPlan.push({
      fromUserId: debtor.userId,
      toUserId: creditor.userId,
      amount: round2(transfer),
    });
    // ponytail: sub-cent dust (<= 0.005 per side) is dropped here instead of
    // emitted as a 0.00 edge; it lands inside the 0.01 epsilon used by
    // allSettled. Fine because all inputs are 2-decimal amounts, so this only
    // ever absorbs float noise, never real money.
    if (debtor.amount > 0.005) insertSortedDesc(debtors, debtor);
    if (creditor.amount > 0.005) insertSortedDesc(creditors, creditor);
  }

  const allSettled = balances.every((b) => Math.abs(b.netBalance) <= 0.01);

  return { members: balances, debtPlan, totalExpenses, allSettled };
}

/**
 * Returns the planned amount for a specific debtor -> creditor edge (rounded
 * to 2 decimals), or null when no such edge exists (nothing owed).
 */
export function findOutstandingDebt(
  debtPlan: DebtEdge[],
  fromUserId: string,
  toUserId: string,
): number | null {
  const edge = debtPlan.find((e) => e.fromUserId === fromUserId && e.toUserId === toUserId);
  return edge && edge.amount > 0 ? round2(edge.amount) : null;
}
