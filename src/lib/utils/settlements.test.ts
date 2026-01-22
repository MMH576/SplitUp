import { describe, it, expect } from "vitest";
import {
  calculateSettlements,
  verifySettlements,
  formatSettlementSummary,
} from "./settlements";
import { MemberBalance } from "./balances";

describe("calculateSettlements", () => {
  it("returns empty array when everyone is settled", () => {
    const balances: MemberBalance[] = [
      { clerkUserId: "user1", displayName: "Alice", netCents: 0 },
      { clerkUserId: "user2", displayName: "Bob", netCents: 0 },
    ];

    const transfers = calculateSettlements(balances);
    expect(transfers).toEqual([]);
  });

  it("handles simple two-person settlement", () => {
    // Alice is owed $30, Bob owes $30
    const balances: MemberBalance[] = [
      { clerkUserId: "alice", displayName: "Alice", netCents: 3000 },
      { clerkUserId: "bob", displayName: "Bob", netCents: -3000 },
    ];

    const transfers = calculateSettlements(balances);

    expect(transfers).toHaveLength(1);
    expect(transfers[0]).toEqual({
      fromClerkUserId: "bob",
      fromDisplayName: "Bob",
      toClerkUserId: "alice",
      toDisplayName: "Alice",
      amountCents: 3000,
    });
  });

  it("handles three-person settlement from example", () => {
    // Alice: +$30 (owed), Bob: -$20 (owes), Carol: -$10 (owes)
    const balances: MemberBalance[] = [
      { clerkUserId: "alice", displayName: "Alice", netCents: 3000 },
      { clerkUserId: "bob", displayName: "Bob", netCents: -2000 },
      { clerkUserId: "carol", displayName: "Carol", netCents: -1000 },
    ];

    const transfers = calculateSettlements(balances);

    // Should be 2 transfers: Bob pays Alice $20, Carol pays Alice $10
    expect(transfers).toHaveLength(2);

    // Greedy: largest debtor (Bob -$20) matched with creditor (Alice +$30)
    expect(transfers[0].fromDisplayName).toBe("Bob");
    expect(transfers[0].toDisplayName).toBe("Alice");
    expect(transfers[0].amountCents).toBe(2000);

    // Then Carol pays remaining
    expect(transfers[1].fromDisplayName).toBe("Carol");
    expect(transfers[1].toDisplayName).toBe("Alice");
    expect(transfers[1].amountCents).toBe(1000);

    // Verify settlements settle to zero
    expect(verifySettlements(balances, transfers)).toBe(true);
  });

  it("handles complex multi-creditor scenario", () => {
    // Alice: +$20, Bob: +$10, Carol: -$15, Dan: -$15
    const balances: MemberBalance[] = [
      { clerkUserId: "alice", displayName: "Alice", netCents: 2000 },
      { clerkUserId: "bob", displayName: "Bob", netCents: 1000 },
      { clerkUserId: "carol", displayName: "Carol", netCents: -1500 },
      { clerkUserId: "dan", displayName: "Dan", netCents: -1500 },
    ];

    const transfers = calculateSettlements(balances);

    // Verify all transfers settle to zero
    expect(verifySettlements(balances, transfers)).toBe(true);

    // Should minimize transactions
    expect(transfers.length).toBeLessThanOrEqual(3);
  });

  it("produces no negative or zero amount transfers", () => {
    const balances: MemberBalance[] = [
      { clerkUserId: "a", displayName: "A", netCents: 5000 },
      { clerkUserId: "b", displayName: "B", netCents: -2000 },
      { clerkUserId: "c", displayName: "C", netCents: -3000 },
    ];

    const transfers = calculateSettlements(balances);

    transfers.forEach((t) => {
      expect(t.amountCents).toBeGreaterThan(0);
    });
  });

  it("handles single cent remainders correctly", () => {
    // Ensure edge case with small amounts works
    const balances: MemberBalance[] = [
      { clerkUserId: "a", displayName: "A", netCents: 1 },
      { clerkUserId: "b", displayName: "B", netCents: -1 },
    ];

    const transfers = calculateSettlements(balances);

    expect(transfers).toHaveLength(1);
    expect(transfers[0].amountCents).toBe(1);
    expect(verifySettlements(balances, transfers)).toBe(true);
  });
});

describe("verifySettlements", () => {
  it("returns true for valid settlement", () => {
    const balances: MemberBalance[] = [
      { clerkUserId: "a", displayName: "A", netCents: 1000 },
      { clerkUserId: "b", displayName: "B", netCents: -1000 },
    ];

    const transfers = [
      {
        fromClerkUserId: "b",
        fromDisplayName: "B",
        toClerkUserId: "a",
        toDisplayName: "A",
        amountCents: 1000,
      },
    ];

    expect(verifySettlements(balances, transfers)).toBe(true);
  });

  it("returns false for incomplete settlement", () => {
    const balances: MemberBalance[] = [
      { clerkUserId: "a", displayName: "A", netCents: 1000 },
      { clerkUserId: "b", displayName: "B", netCents: -1000 },
    ];

    const transfers = [
      {
        fromClerkUserId: "b",
        fromDisplayName: "B",
        toClerkUserId: "a",
        toDisplayName: "A",
        amountCents: 500, // Only half
      },
    ];

    expect(verifySettlements(balances, transfers)).toBe(false);
  });

  it("returns true for empty balances and transfers", () => {
    expect(verifySettlements([], [])).toBe(true);
  });
});

describe("formatSettlementSummary", () => {
  it("returns friendly message when no transfers needed", () => {
    const summary = formatSettlementSummary([]);
    expect(summary).toBe("Everyone is settled up! No payments needed.");
  });

  it("formats single transfer correctly", () => {
    const transfers = [
      {
        fromClerkUserId: "b",
        fromDisplayName: "Bob",
        toClerkUserId: "a",
        toDisplayName: "Alice",
        amountCents: 2000,
      },
    ];

    const summary = formatSettlementSummary(transfers);
    expect(summary).toBe("Bob pays Alice $20.00");
  });

  it("formats multiple transfers with newlines", () => {
    const transfers = [
      {
        fromClerkUserId: "b",
        fromDisplayName: "Bob",
        toClerkUserId: "a",
        toDisplayName: "Alice",
        amountCents: 2000,
      },
      {
        fromClerkUserId: "c",
        fromDisplayName: "Carol",
        toClerkUserId: "a",
        toDisplayName: "Alice",
        amountCents: 1000,
      },
    ];

    const summary = formatSettlementSummary(transfers);
    expect(summary).toContain("Bob pays Alice $20.00");
    expect(summary).toContain("Carol pays Alice $10.00");
    expect(summary.split("\n")).toHaveLength(2);
  });
});
