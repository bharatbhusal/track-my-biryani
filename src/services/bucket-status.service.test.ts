import { describe, expect, it } from "vitest";

import type { BucketLifecycleStatus } from "@/constants/types/bucket.types";
import { AppError } from "@/lib/errors";
import { resolveBucketStatus } from "@/repositories/bucket.repository";

import {
  ACTION_STATUSES,
  assertActionAllowed,
  BUCKET_TRANSITIONS,
  type BucketAction,
} from "./bucket-status.service";

// The four real lifecycle statuses. Legacy docs with no status field are
// covered separately: resolveBucketStatus maps them to "live" (or "close"
// once closedAt is set), so `undefined` is not its own permission state.
const ALL_STATUSES: BucketLifecycleStatus[] = [
  "live",
  "settlement-config",
  "settlement-live",
  "close",
];

type BucketState = { status?: BucketLifecycleStatus; closedAt?: Date };

function expectAllowed(bucket: BucketState, action: BucketAction) {
  expect(() => assertActionAllowed(bucket, action)).not.toThrow();
}

function expectDenied(bucket: BucketState, action: BucketAction) {
  expect(() => assertActionAllowed(bucket, action)).toThrow(AppError);
}

describe("resolveBucketStatus (pure fallback)", () => {
  it('keeps an explicit "live" status', () => {
    expect(resolveBucketStatus({ status: "live" })).toBe("live");
  });

  it('keeps an explicit "settlement-config" status', () => {
    expect(resolveBucketStatus({ status: "settlement-config" })).toBe("settlement-config");
  });

  it('keeps an explicit "settlement-live" status', () => {
    expect(resolveBucketStatus({ status: "settlement-live" })).toBe("settlement-live");
  });

  it('keeps an explicit "close" status', () => {
    expect(resolveBucketStatus({ status: "close" })).toBe("close");
  });

  it("defaults a doc with neither status nor closedAt to live", () => {
    expect(resolveBucketStatus({})).toBe("live");
  });

  it("treats a legacy doc with closedAt as close", () => {
    expect(resolveBucketStatus({ closedAt: new Date() })).toBe("close");
  });

  it("lets an explicit status win over closedAt on a hybrid doc", () => {
    expect(resolveBucketStatus({ status: "live", closedAt: new Date() })).toBe("live");
  });
});

describe("BUCKET_TRANSITIONS", () => {
  it("keys are exactly the four lifecycle statuses", () => {
    expect(Object.keys(BUCKET_TRANSITIONS)).toEqual([
      "live",
      "settlement-config",
      "settlement-live",
      "close",
    ]);
  });

  it('"live" only transitions to "settlement-config"', () => {
    expect(BUCKET_TRANSITIONS.live).toEqual(["settlement-config"]);
  });

  it('"settlement-config" only transitions to "settlement-live" or back to "live"', () => {
    expect(BUCKET_TRANSITIONS["settlement-config"]).toEqual(["settlement-live", "live"]);
  });

  it('"settlement-live" and "close" transition nowhere', () => {
    expect(BUCKET_TRANSITIONS["settlement-live"]).toEqual([]);
    expect(BUCKET_TRANSITIONS.close).toEqual([]);
  });
});

describe("expense actions", () => {
  const actions: BucketAction[] = ["expense.create", "expense.update", "expense.delete"];

  it.each(actions)("%s is allowed only while the bucket is live", (action) => {
    expectAllowed({ status: "live" }, action);

    for (const status of ALL_STATUSES) {
      if (status === "live") {
        continue;
      }
      expectDenied({ status }, action);
    }
  });
});

describe("category actions", () => {
  const actions: BucketAction[] = ["category.create", "category.update", "category.delete"];

  it.each(actions)("%s is allowed only while the bucket is live", (action) => {
    expectAllowed({ status: "live" }, action);

    for (const status of ALL_STATUSES) {
      if (status === "live") {
        continue;
      }
      expectDenied({ status }, action);
    }
  });
});

describe("member actions", () => {
  const actions: BucketAction[] = [
    "member.invite",
    "member.accept",
    "member.join",
    "member.leave",
    "member.revoke",
  ];

  it.each(actions)("%s is allowed only while the bucket is live", (action) => {
    expectAllowed({ status: "live" }, action);

    for (const status of ALL_STATUSES) {
      if (status === "live") {
        continue;
      }
      expectDenied({ status }, action);
    }
  });
});

describe("share.configure", () => {
  it("is allowed only in settlement-config", () => {
    expectAllowed({ status: "settlement-config" }, "share.configure");

    for (const status of ALL_STATUSES) {
      if (status === "settlement-config") {
        continue;
      }
      expectDenied({ status }, "share.configure");
    }
  });
});

describe("settlement.confirm", () => {
  it("is allowed only in settlement-live", () => {
    expectAllowed({ status: "settlement-live" }, "settlement.confirm");

    for (const status of ALL_STATUSES) {
      if (status === "settlement-live") {
        continue;
      }
      expectDenied({ status }, "settlement.confirm");
    }
  });
});

describe("bucket actions", () => {
  it("bucket.close is allowed only in settlement-live", () => {
    expectAllowed({ status: "settlement-live" }, "bucket.close");

    for (const status of ALL_STATUSES) {
      if (status === "settlement-live") {
        continue;
      }
      expectDenied({ status }, "bucket.close");
    }
  });

  it("bucket.delete is allowed only while the bucket is live", () => {
    expectAllowed({ status: "live" }, "bucket.delete");

    for (const status of ALL_STATUSES) {
      if (status === "live") {
        continue;
      }
      expectDenied({ status }, "bucket.delete");
    }
  });
});

describe("budget actions", () => {
  const actions: BucketAction[] = ["budget.create", "budget.update", "budget.delete"];

  it.each(actions)("%s is allowed in live, settlement-config, and settlement-live", (action) => {
    expectAllowed({ status: "live" }, action);
    expectAllowed({ status: "settlement-config" }, action);
    expectAllowed({ status: "settlement-live" }, action);

    expectDenied({ status: "close" }, action);
  });
});

describe("assertActionAllowed error shape", () => {
  it("throws an AppError with status 403 naming the action and current status", () => {
    try {
      assertActionAllowed({ status: "close" }, "expense.create");
      expect.unreachable("assertActionAllowed should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).statusCode).toBe(403);
      expect((error as AppError).message).toBe(
        'Action "expense.create" is not allowed when bucket status is "close"',
      );
    }
  });
});

describe("ACTION_STATUSES matrix", () => {
  it("covers exactly 18 actions", () => {
    expect(Object.keys(ACTION_STATUSES).length).toBe(18);
  });
});

describe("legacy documents without a status field", () => {
  it("resolve to live (no closedAt), so live-only actions stay allowed", () => {
    expectAllowed({}, "expense.create");
    expectAllowed({}, "member.invite");
    expectAllowed({}, "bucket.delete");
    expectAllowed({}, "budget.create");

    expectDenied({}, "share.configure");
    expectDenied({}, "settlement.confirm");
    expectDenied({}, "bucket.close");
  });

  it("with closedAt resolve to close, blocking live and budget actions", () => {
    const closedLegacy = { closedAt: new Date() };
    expectDenied(closedLegacy, "expense.create");
    expectDenied(closedLegacy, "member.invite");
    expectDenied(closedLegacy, "budget.create");
  });
});

describe("transition triggers deny member writes", () => {
  it("in settlement-config", () => {
    expectDenied({ status: "settlement-config" }, "expense.create");
    expectDenied({ status: "settlement-config" }, "category.create");
    expectDenied({ status: "settlement-config" }, "member.invite");
  });

  it("in settlement-live", () => {
    expectDenied({ status: "settlement-live" }, "expense.update");
    expectDenied({ status: "settlement-live" }, "category.update");
    expectDenied({ status: "settlement-live" }, "member.leave");
  });

  it("in close", () => {
    expectDenied({ status: "close" }, "expense.delete");
    expectDenied({ status: "close" }, "category.delete");
    expectDenied({ status: "close" }, "member.revoke");
  });
});
