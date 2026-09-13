import { describe, expect, it } from "vitest";

import { computeSettlement, findOutstandingDebt, round2 } from "./settle";
import { demo } from "./settle.self.test";

const bucketCreatedAt = new Date("2026-01-01T00:00:00.000Z");

describe("computeSettlement", () => {
  it("splits a single expense equally among all members by default", () => {
    // Human story: A, B, C share a bucket from day one. A pays 300 for a group
    // dinner. With no shares map the cost splits 100/100/100, so A is owed 200
    // and B and C owe 100 each.
    const res = computeSettlement({
      members: [
        { userId: "A", joinedAt: bucketCreatedAt },
        { userId: "B", joinedAt: bucketCreatedAt },
        { userId: "C", joinedAt: bucketCreatedAt },
      ],
      shares: {},
      expenses: [{ userId: "A", amount: 300, paidAt: new Date("2026-01-02T00:00:00.000Z") }],
      settlements: [],
      bucketCreatedAt,
    });

    expect(res.totalExpenses).toBe(300);
    expect(res.members).toEqual([
      { memberId: "A", owedAmount: 100, paidAmount: 300, netBalance: 200 },
      { memberId: "B", owedAmount: 100, paidAmount: 0, netBalance: -100 },
      { memberId: "C", owedAmount: 100, paidAmount: 0, netBalance: -100 },
    ]);
    expect(res.debtPlan).toEqual([
      { fromUserId: "B", toUserId: "A", amount: 100 },
      { fromUserId: "C", toUserId: "A", amount: 100 },
    ]);
    expect(res.allSettled).toBe(false);
  });

  it("splits by proportional shares when every member has a share", () => {
    // Human story: the group agrees on 50/30/20 shares. A pays a 1000 bill;
    // each owes their percentage, so B and C settle with A directly.
    const res = computeSettlement({
      members: [
        { userId: "A", joinedAt: bucketCreatedAt },
        { userId: "B", joinedAt: bucketCreatedAt },
        { userId: "C", joinedAt: bucketCreatedAt },
      ],
      shares: { A: 50, B: 30, C: 20 },
      expenses: [{ userId: "A", amount: 1000, paidAt: new Date("2026-01-02T00:00:00.000Z") }],
      settlements: [],
      bucketCreatedAt,
    });

    const byId = new Map(res.members.map((m) => [m.memberId, m]));
    expect(byId.get("A")!.owedAmount).toBe(500);
    expect(byId.get("B")!.owedAmount).toBe(300);
    expect(byId.get("C")!.owedAmount).toBe(200);
    expect(byId.get("A")!.netBalance).toBe(500);
    expect(byId.get("B")!.netBalance).toBe(-300);
    expect(byId.get("C")!.netBalance).toBe(-200);
    expect(res.debtPlan).toEqual([
      { fromUserId: "B", toUserId: "A", amount: 300 },
      { fromUserId: "C", toUserId: "A", amount: 200 },
    ]);
  });

  it("prorates by join date: a late joiner owes nothing for earlier expenses", () => {
    // Human story: A and B joined Jan 1. C joined Jan 10. E1 (A paid 300, Jan 5)
    // predates C, so only A and B split it (150 each). E2 (B paid 600, Jan 15)
    // includes C at 200. C's total owed is exactly the E2 share, zero for E1.
    const res = computeSettlement({
      members: [
        { userId: "A", joinedAt: new Date("2026-01-01T00:00:00.000Z") },
        { userId: "B", joinedAt: new Date("2026-01-01T00:00:00.000Z") },
        { userId: "C", joinedAt: new Date("2026-01-10T00:00:00.000Z") },
      ],
      shares: {},
      expenses: [
        { userId: "A", amount: 300, paidAt: new Date("2026-01-05T00:00:00.000Z") },
        { userId: "B", amount: 600, paidAt: new Date("2026-01-15T00:00:00.000Z") },
      ],
      settlements: [],
      bucketCreatedAt,
    });

    const byId = new Map(res.members.map((m) => [m.memberId, m]));
    expect(byId.get("C")!.owedAmount).toBe(200); // exactly the E2 share; 0 for E1
    expect(byId.get("A")!.owedAmount).toBe(350); // 150 (E1) + 200 (E2)
    expect(byId.get("B")!.owedAmount).toBe(350);
    expect(byId.get("A")!.netBalance).toBe(-50);
    expect(byId.get("B")!.netBalance).toBe(250);
    expect(byId.get("C")!.netBalance).toBe(-200);
    expect(res.debtPlan).toEqual([
      { fromUserId: "C", toUserId: "B", amount: 200 },
      { fromUserId: "A", toUserId: "B", amount: 50 },
    ]);
  });

  it("falls back to equal split when the shares map is partial", () => {
    // Human story: only some members have declared shares (A: 50, B: 30),
    // C has none. The module treats ANY incomplete map as no map at all
    // (all-or-nothing), so everyone splits 300 equally. Totals still balance.
    const res = computeSettlement({
      members: [
        { userId: "A", joinedAt: bucketCreatedAt },
        { userId: "B", joinedAt: bucketCreatedAt },
        { userId: "C", joinedAt: bucketCreatedAt },
      ],
      shares: { A: 50, B: 30 },
      expenses: [{ userId: "A", amount: 300, paidAt: new Date("2026-01-02T00:00:00.000Z") }],
      settlements: [],
      bucketCreatedAt,
    });

    const byId = new Map(res.members.map((m) => [m.memberId, m]));
    expect(byId.get("A")!.owedAmount).toBe(100);
    expect(byId.get("B")!.owedAmount).toBe(100);
    expect(byId.get("C")!.owedAmount).toBe(100);
    expect(byId.get("A")!.netBalance).toBe(200);
    expect(res.members.reduce((sum, m) => sum + m.owedAmount, 0)).toBe(res.totalExpenses);
    expect(res.debtPlan).toEqual([
      { fromUserId: "B", toUserId: "A", amount: 100 },
      { fromUserId: "C", toUserId: "A", amount: 100 },
    ]);
  });

  it("simplifies a 4-member tangle down to fewer edges, conserving nets", () => {
    // Human story: A pays 100, B pays 60, C pays 40 across three shared bills
    // (each split 4 ways). Nets: A +50, B +10, C -10, D -50. The naive pairwise
    // settle would need 4 transfers (2 debtors x 2 creditors); the greedy plan
    // reduces it to 2 edges while realizing exactly the same net balances.
    const res = computeSettlement({
      members: ["A", "B", "C", "D"].map((userId) => ({ userId, joinedAt: bucketCreatedAt })),
      shares: {},
      expenses: [
        { userId: "A", amount: 100, paidAt: new Date("2026-01-02T00:00:00.000Z") },
        { userId: "B", amount: 60, paidAt: new Date("2026-01-03T00:00:00.000Z") },
        { userId: "C", amount: 40, paidAt: new Date("2026-01-04T00:00:00.000Z") },
      ],
      settlements: [],
      bucketCreatedAt,
    });

    const nets = new Map(res.members.map((m) => [m.memberId, m.netBalance]));
    expect(nets.get("A")).toBe(50);
    expect(nets.get("B")).toBe(10);
    expect(nets.get("C")).toBe(-10);
    expect(nets.get("D")).toBe(-50);

    // One transfer fewer than the naive pairwise count (2 debtors x 2 creditors = 4).
    expect(res.debtPlan).toHaveLength(2);
    expect(res.debtPlan).toEqual([
      { fromUserId: "D", toUserId: "A", amount: 50 },
      { fromUserId: "C", toUserId: "B", amount: 10 },
    ]);

    // Conservation: applying the plan's edges reproduces each net balance exactly.
    const planEffect = new Map(res.members.map((m) => [m.memberId, 0]));
    for (const edge of res.debtPlan) {
      expect(edge.amount).toBeGreaterThan(0);
      planEffect.set(edge.fromUserId, planEffect.get(edge.fromUserId)! - edge.amount);
      planEffect.set(edge.toUserId, planEffect.get(edge.toUserId)! + edge.amount);
    }
    for (const m of res.members) {
      expect(planEffect.get(m.memberId)).toBeCloseTo(m.netBalance, 5);
    }

    // Group-level: what creditors are owed equals what debtors owe, within 0.01.
    const creditTotal = res.members
      .filter((m) => m.netBalance > 0)
      .reduce((s, m) => s + m.netBalance, 0);
    const owedTotal = res.members
      .filter((m) => m.netBalance < 0)
      .reduce((s, m) => s - m.netBalance, 0);
    expect(creditTotal).toBe(60);
    expect(creditTotal).toBeCloseTo(owedTotal, 2);
  });

  it("transfer discharges the debtor's debit and the creditor's credit (B->A settles 50)", () => {
    // Human story: A covered a 100 bill split 50/50 with B. B's debt to the
    // group is discharged only when the money actually moves: the debtor (B)
    // pays the creditor (A) 50, and both nets land on zero.
    const res = computeSettlement({
      members: [
        { userId: "A", joinedAt: bucketCreatedAt },
        { userId: "B", joinedAt: bucketCreatedAt },
      ],
      shares: {},
      expenses: [{ userId: "A", amount: 100, paidAt: new Date("2026-01-02T00:00:00.000Z") }],
      settlements: [{ fromUserId: "B", toUserId: "A", amount: 50 }], // debtor -> creditor
      bucketCreatedAt,
    });

    const byId = new Map(res.members.map((m) => [m.memberId, m]));
    // A: covered 100, got 50 back -> paid 50 net of the repayment; owed 50 -> net 0.
    expect(byId.get("A")!.owedAmount).toBe(50);
    expect(byId.get("A")!.paidAmount).toBe(50);
    expect(byId.get("A")!.netBalance).toBe(0);
    // B: sent 50, discharging its debit; owed 50 -> paid 50 -> net 0.
    expect(byId.get("B")!.owedAmount).toBe(50);
    expect(byId.get("B")!.paidAmount).toBe(50);
    expect(byId.get("B")!.netBalance).toBe(0);
    expect(res.debtPlan).toEqual([]);
    expect(res.allSettled).toBe(true);
  });

  it("uses a 0.01 epsilon for allSettled", () => {
    // Human story: sub-cent dust after rounding is ignored (net exactly 0.01
    // counts as settled), but a real 0.02 imbalance keeps the bucket open.
    const base = {
      members: [
        { userId: "A", joinedAt: bucketCreatedAt },
        { userId: "B", joinedAt: bucketCreatedAt },
      ],
      shares: {},
      settlements: [],
      bucketCreatedAt,
    };

    // A pays 0.02 split 2 ways -> each owes 0.01 -> nets +0.01 / -0.01.
    const inEpsilon = computeSettlement({
      ...base,
      expenses: [{ userId: "A", amount: 0.02, paidAt: new Date("2026-01-02T00:00:00.000Z") }],
    });
    expect(inEpsilon.allSettled).toBe(true);

    // A pays 0.04 split 2 ways -> each owes 0.02 -> nets +0.02 / -0.02.
    const outOfEpsilon = computeSettlement({
      ...base,
      expenses: [{ userId: "A", amount: 0.04, paidAt: new Date("2026-01-02T00:00:00.000Z") }],
    });
    expect(outOfEpsilon.allSettled).toBe(false);
  });

  it("returns an empty, settled result for an empty bucket", () => {
    // Human story: a freshly created bucket with members but no activity.
    const res = computeSettlement({
      members: [
        { userId: "A", joinedAt: bucketCreatedAt },
        { userId: "B", joinedAt: bucketCreatedAt },
      ],
      shares: {},
      expenses: [],
      settlements: [],
      bucketCreatedAt,
    });

    expect(res.totalExpenses).toBe(0);
    expect(res.debtPlan).toEqual([]);
    expect(res.allSettled).toBe(true);
    expect(res.members.every((m) => m.owedAmount === 0 && m.paidAmount === 0)).toBe(true);
  });

  it("is deterministic: identical inputs produce deep-equal results", () => {
    const opts = {
      members: [
        { userId: "A", joinedAt: bucketCreatedAt },
        { userId: "B", joinedAt: new Date("2026-01-05T00:00:00.000Z") },
        { userId: "C", joinedAt: new Date("2026-01-10T00:00:00.000Z") },
      ],
      shares: { A: 40, B: 40, C: 20 },
      expenses: [
        { userId: "B", amount: 120, paidAt: new Date("2026-01-08T00:00:00.000Z") },
        { userId: "C", amount: 90, paidAt: new Date("2026-01-12T00:00:00.000Z") },
      ],
      settlements: [{ fromUserId: "A", toUserId: "B", amount: 10 }], // A is the only net debtor
      bucketCreatedAt,
    };
    expect(computeSettlement(opts)).toEqual(computeSettlement(opts));
  });
});

describe("findOutstandingDebt", () => {
  it("returns the planned amount for an existing edge", () => {
    const plan = [
      { fromUserId: "A", toUserId: "B", amount: 10.5 },
      { fromUserId: "C", toUserId: "D", amount: 7.25 },
    ];
    expect(findOutstandingDebt(plan, "A", "B")).toBe(10.5);
    expect(findOutstandingDebt(plan, "C", "D")).toBe(7.25);
  });

  it("returns null for a non-edge and for a fully settled pair", () => {
    // Human story: querying a pair with no planned edge (nothing owed), and a
    // pair whose whole bucket has been settled (no edges remain at all).
    const plan = [{ fromUserId: "A", toUserId: "B", amount: 10.5 }];
    expect(findOutstandingDebt(plan, "B", "A")).toBeNull(); // reversed: no edge
    expect(findOutstandingDebt(plan, "A", "C")).toBeNull(); // unrelated: no edge

    const settled = computeSettlement({
      members: [
        { userId: "A", joinedAt: bucketCreatedAt },
        { userId: "B", joinedAt: bucketCreatedAt },
      ],
      shares: {},
      expenses: [{ userId: "A", amount: 100, paidAt: new Date("2026-01-02T00:00:00.000Z") }],
      settlements: [{ fromUserId: "B", toUserId: "A", amount: 50 }],
      bucketCreatedAt,
    });
    expect(settled.allSettled).toBe(true);
    expect(findOutstandingDebt(settled.debtPlan, "A", "B")).toBeNull();
  });

  it("returns null for a zero-amount edge", () => {
    // Guard: a (non-constructible) 0.00 edge is treated as nothing owed.
    expect(
      findOutstandingDebt([{ fromUserId: "A", toUserId: "B", amount: 0 }], "A", "B"),
    ).toBeNull();
  });
});

describe("round2", () => {
  it("rounds to 2 decimals, documenting the ACTUAL float behavior", () => {
    // JS floats make round-half-up unreliable at the last digit: 1.005 * 100 is
    // 100.49999... (rounds DOWN to 1.00) while 2.675 * 100 is 267.50000...03
    // (rounds UP to 2.68). These assertions lock in V8's deterministic output.
    expect(round2(1.005)).toBe(1);
    expect(round2(2.675)).toBe(2.68);
    expect(round2(10.254)).toBe(10.25);
    expect(round2(10.256)).toBe(10.26);
    expect(round2(100)).toBe(100);
  });
});

describe("settle.self.test (Jon's runner-free demo)", () => {
  it("passes under vitest", () => {
    demo();
  });
});
