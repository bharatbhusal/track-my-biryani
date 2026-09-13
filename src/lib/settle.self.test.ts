import assert from "node:assert";

import { computeSettlement, findOutstandingDebt, type MemberBalance } from "./settle";

/**
 * Self-check for the settlement math. No test framework here (Sam adds
 * vitest separately); exports `demo()` so any runner can call it.
 *
 * If tsx is ever installed: npx tsx src/lib/settle.self.test.ts
 * Otherwise Sam's suite should call demo() once per test.
 */
export function demo(): void {
  // ---------------------------------------------------------------------------
  // Scenario: three friends, pays-on-signup bucket, one late joiner, one prior
  // transfer already completed.
  //   A and B joined 2026-01-01; C joined 2026-01-10 (LATE).
  //   E1: A paid 300 on 2026-01-05  -> eligible: A, B only (C joined later)  -> 150 each
  //   E2: B paid 600 on 2026-01-15  -> eligible: A, B, C                     -> 200 each
  //   Prior settlement: C sent B 100 (already done).
  // ---------------------------------------------------------------------------
  const bucketCreatedAt = new Date("2026-01-01T00:00:00.000Z");
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
    settlements: [{ fromUserId: "C", toUserId: "B", amount: 100 }],
    bucketCreatedAt,
  });

  const byId = new Map<string, MemberBalance>(res.members.map((m) => [m.memberId, m]));
  // A: owes 150 + 200 = 350, covered 300                -> net -50
  assert.deepStrictEqual(byId.get("A")!, {
    memberId: "A",
    owedAmount: 350,
    paidAmount: 300,
    netBalance: -50,
  });
  // B: owes 350, covered 600, was repaid 100 by C       -> net +150
  assert.deepStrictEqual(byId.get("B")!, {
    memberId: "B",
    owedAmount: 350,
    paidAmount: 500,
    netBalance: 150,
  });
  // C: owes 200 (skipped E1, joined after 01-05), already paid B 100 -> net -100
  assert.deepStrictEqual(byId.get("C")!, {
    memberId: "C",
    owedAmount: 200,
    paidAmount: 100,
    netBalance: -100,
  });

  // Invariants: totals balance, proration applied, debt plan greedy + sorted.
  assert.strictEqual(res.totalExpenses, 900);
  assert.strictEqual(
    res.members.reduce((sum, m) => sum + m.netBalance, 0),
    0,
  );
  assert.strictEqual(res.allSettled, false);
  assert.deepStrictEqual(res.debtPlan, [
    { fromUserId: "C", toUserId: "B", amount: 100 }, // largest debtor C -> largest creditor B
    { fromUserId: "A", toUserId: "B", amount: 50 }, // then A settles the rest with B
  ]);
  assert.strictEqual(findOutstandingDebt(res.debtPlan, "C", "B"), 100);
  assert.strictEqual(findOutstandingDebt(res.debtPlan, "A", "B"), 50);
  assert.strictEqual(findOutstandingDebt(res.debtPlan, "A", "C"), null); // no such edge

  // ---------------------------------------------------------------------------
  // Proportional shares path: complete shares split the expense by percentage.
  // ---------------------------------------------------------------------------
  const res2 = computeSettlement({
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
  const byId2 = new Map<string, MemberBalance>(res2.members.map((m) => [m.memberId, m]));
  assert.deepStrictEqual(byId2.get("A")!, {
    memberId: "A",
    owedAmount: 500,
    paidAmount: 1000,
    netBalance: 500,
  });
  assert.deepStrictEqual(byId2.get("B")!, {
    memberId: "B",
    owedAmount: 300,
    paidAmount: 0,
    netBalance: -300,
  });
  assert.deepStrictEqual(byId2.get("C")!, {
    memberId: "C",
    owedAmount: 200,
    paidAmount: 0,
    netBalance: -200,
  });
  assert.deepStrictEqual(res2.debtPlan, [
    { fromUserId: "B", toUserId: "A", amount: 300 },
    { fromUserId: "C", toUserId: "A", amount: 200 },
  ]);

  // ---------------------------------------------------------------------------
  // Empty bucket: everyone at zero -> allSettled, no edges.
  // ---------------------------------------------------------------------------
  const res3 = computeSettlement({
    members: [
      { userId: "A", joinedAt: bucketCreatedAt },
      { userId: "B", joinedAt: bucketCreatedAt },
    ],
    shares: {},
    expenses: [],
    settlements: [],
    bucketCreatedAt,
  });
  assert.strictEqual(res3.totalExpenses, 0);
  assert.deepStrictEqual(res3.debtPlan, []);
  assert.strictEqual(res3.allSettled, true);

  console.log("settle.self.test: all assertions passed");
}
