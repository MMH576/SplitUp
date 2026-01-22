import { describe, it, expect } from "vitest";
import { calculateEqualSplit, verifySplitsTotal } from "./splits";

describe("calculateEqualSplit", () => {
  it("splits evenly when divisible", () => {
    const splits = calculateEqualSplit(1000, ["user1", "user2"]);

    expect(splits).toHaveLength(2);
    expect(splits[0].shareCents).toBe(500);
    expect(splits[1].shareCents).toBe(500);
    expect(verifySplitsTotal(splits, 1000)).toBe(true);
  });

  it("handles remainder by giving extra cents to first participants", () => {
    // 1000 cents / 3 = 333.33... so 333 base + 1 remainder
    const splits = calculateEqualSplit(1000, ["user1", "user2", "user3"]);

    expect(splits).toHaveLength(3);
    // Sorted alphabetically: user1, user2, user3
    // First 1 person gets +1 cent (remainder is 1)
    expect(splits[0].shareCents).toBe(334); // user1 gets extra
    expect(splits[1].shareCents).toBe(333); // user2
    expect(splits[2].shareCents).toBe(333); // user3
    expect(verifySplitsTotal(splits, 1000)).toBe(true);
  });

  it("distributes multiple remainder cents correctly", () => {
    // 1001 cents / 3 = 333 base + 2 remainder
    const splits = calculateEqualSplit(1001, ["user1", "user2", "user3"]);

    expect(splits[0].shareCents).toBe(334); // user1 gets +1
    expect(splits[1].shareCents).toBe(334); // user2 gets +1
    expect(splits[2].shareCents).toBe(333); // user3 gets base
    expect(verifySplitsTotal(splits, 1001)).toBe(true);
  });

  it("handles single participant", () => {
    const splits = calculateEqualSplit(1000, ["user1"]);

    expect(splits).toHaveLength(1);
    expect(splits[0].shareCents).toBe(1000);
    expect(verifySplitsTotal(splits, 1000)).toBe(true);
  });

  it("handles small amounts with many participants", () => {
    // 3 cents split among 5 people: 3 get 1 cent, 2 get 0 cents
    const splits = calculateEqualSplit(3, ["a", "b", "c", "d", "e"]);

    const total = splits.reduce((sum, s) => sum + s.shareCents, 0);
    expect(total).toBe(3);
    expect(splits.filter((s) => s.shareCents === 1)).toHaveLength(3);
    expect(splits.filter((s) => s.shareCents === 0)).toHaveLength(2);
  });

  it("is deterministic with sorted participant IDs", () => {
    // Same input should always produce same output
    const splits1 = calculateEqualSplit(1000, ["user3", "user1", "user2"]);
    const splits2 = calculateEqualSplit(1000, ["user1", "user2", "user3"]);

    expect(splits1).toEqual(splits2);
  });

  it("throws error for empty participants", () => {
    expect(() => calculateEqualSplit(1000, [])).toThrow(
      "At least one participant is required"
    );
  });

  it("throws error for zero amount", () => {
    expect(() => calculateEqualSplit(0, ["user1"])).toThrow(
      "Amount must be a positive integer"
    );
  });

  it("throws error for negative amount", () => {
    expect(() => calculateEqualSplit(-100, ["user1"])).toThrow(
      "Amount must be a positive integer"
    );
  });

  it("throws error for non-integer amount", () => {
    expect(() => calculateEqualSplit(10.5, ["user1"])).toThrow(
      "Amount must be a positive integer"
    );
  });
});

describe("verifySplitsTotal", () => {
  it("returns true when splits match expected total", () => {
    const splits = [
      { clerkUserId: "user1", shareCents: 500 },
      { clerkUserId: "user2", shareCents: 500 },
    ];
    expect(verifySplitsTotal(splits, 1000)).toBe(true);
  });

  it("returns false when splits don't match expected total", () => {
    const splits = [
      { clerkUserId: "user1", shareCents: 500 },
      { clerkUserId: "user2", shareCents: 400 },
    ];
    expect(verifySplitsTotal(splits, 1000)).toBe(false);
  });

  it("handles empty splits array", () => {
    expect(verifySplitsTotal([], 0)).toBe(true);
    expect(verifySplitsTotal([], 100)).toBe(false);
  });
});
