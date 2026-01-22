/**
 * Settlement Algorithm
 *
 * Generates an optimized list of payments to settle all debts in a group.
 * Uses a greedy algorithm that minimizes the number of transactions.
 *
 * Example:
 * - Alice: +$30 (owed money)
 * - Bob: -$20 (owes money)
 * - Carol: -$10 (owes money)
 *
 * Settlement plan:
 * 1. Bob pays Alice $20
 * 2. Carol pays Alice $10
 *
 * After these transfers, everyone is at $0.
 */

import { MemberBalance } from "./balances";

export interface Transfer {
  fromClerkUserId: string;
  fromDisplayName: string;
  toClerkUserId: string;
  toDisplayName: string;
  amountCents: number;
}

/**
 * Calculate the optimal settlement plan using a greedy algorithm.
 *
 * Algorithm:
 * 1. Separate members into creditors (positive balance) and debtors (negative balance)
 * 2. Sort both lists by amount (largest first)
 * 3. Match largest debtor with largest creditor
 * 4. Transfer the minimum of their amounts
 * 5. Repeat until all settled
 *
 * @param balances - Array of member balances from calculateGroupBalances
 * @returns Array of transfers that will settle all debts
 */
export function calculateSettlements(balances: MemberBalance[]): Transfer[] {
  // Separate into creditors (positive balance = owed money) and debtors (negative = owes money)
  const creditors = balances
    .filter((b) => b.netCents > 0)
    .map((b) => ({ ...b, remaining: b.netCents }))
    .sort((a, b) => b.remaining - a.remaining); // Largest first

  const debtors = balances
    .filter((b) => b.netCents < 0)
    .map((b) => ({ ...b, remaining: Math.abs(b.netCents) }))
    .sort((a, b) => b.remaining - a.remaining); // Largest first

  const transfers: Transfer[] = [];

  let creditorIndex = 0;
  let debtorIndex = 0;

  // Greedy matching: pair largest debtor with largest creditor
  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    // Transfer the smaller of the two amounts
    const paymentAmount = Math.min(creditor.remaining, debtor.remaining);

    if (paymentAmount > 0) {
      transfers.push({
        fromClerkUserId: debtor.clerkUserId,
        fromDisplayName: debtor.displayName,
        toClerkUserId: creditor.clerkUserId,
        toDisplayName: creditor.displayName,
        amountCents: paymentAmount,
      });

      creditor.remaining -= paymentAmount;
      debtor.remaining -= paymentAmount;
    }

    // Move to next creditor/debtor if fully settled
    if (creditor.remaining === 0) creditorIndex++;
    if (debtor.remaining === 0) debtorIndex++;
  }

  return transfers;
}

/**
 * Verify that after all transfers, everyone would be settled to 0.
 * This is a sanity check - should always return true if algorithm is correct.
 */
export function verifySettlements(
  balances: MemberBalance[],
  transfers: Transfer[]
): boolean {
  // Create a copy of balances to simulate transfers
  const simulatedBalances = new Map<string, number>();
  balances.forEach((b) => simulatedBalances.set(b.clerkUserId, b.netCents));

  // Apply each transfer
  for (const transfer of transfers) {
    const fromBalance = simulatedBalances.get(transfer.fromClerkUserId) ?? 0;
    const toBalance = simulatedBalances.get(transfer.toClerkUserId) ?? 0;

    // Debtor pays, so their balance goes up (less negative / more positive)
    simulatedBalances.set(
      transfer.fromClerkUserId,
      fromBalance + transfer.amountCents
    );
    // Creditor receives, so their balance goes down (less positive)
    simulatedBalances.set(
      transfer.toClerkUserId,
      toBalance - transfer.amountCents
    );
  }

  // Check that everyone is at 0
  for (const balance of simulatedBalances.values()) {
    if (balance !== 0) return false;
  }

  return true;
}

/**
 * Format the settlement plan as a human-readable summary.
 * Useful for copying to share with group members.
 */
export function formatSettlementSummary(transfers: Transfer[]): string {
  if (transfers.length === 0) {
    return "Everyone is settled up! No payments needed.";
  }

  const lines = transfers.map((t) => {
    const amount = (t.amountCents / 100).toFixed(2);
    return `${t.fromDisplayName} pays ${t.toDisplayName} $${amount}`;
  });

  return lines.join("\n");
}
