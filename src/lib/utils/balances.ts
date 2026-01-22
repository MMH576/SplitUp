/**
 * Balance Calculation Utility
 *
 * Calculates net balances for all members in a group.
 *
 * For each expense:
 * - Payer gets CREDIT for the full amount (+amountCents)
 * - Each participant gets DEBIT for their share (-shareCents)
 *
 * Net balance meaning:
 * - Positive = others owe you money (you paid more than your share)
 * - Negative = you owe others money (you paid less than your share)
 * - Zero = you're all settled up
 *
 * Invariant: Sum of all balances in a group ALWAYS equals 0
 */

import { prisma } from "@/lib/prisma";

export interface MemberBalance {
  clerkUserId: string;
  displayName: string;
  netCents: number; // Positive = owed money, Negative = owes money
}

/**
 * Calculate net balances for all members in a group.
 *
 * @param groupId - The group to calculate balances for
 * @returns Array of member balances, sorted by absolute value (largest first)
 */
export async function calculateGroupBalances(
  groupId: string
): Promise<MemberBalance[]> {
  // Get all expenses with splits for this group
  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: {
      splits: true,
    },
  });

  // Get all members
  const members = await prisma.groupMember.findMany({
    where: { groupId },
  });

  // Initialize balance map (all members start at 0)
  const balanceMap = new Map<string, number>();
  members.forEach((m) => balanceMap.set(m.clerkUserId, 0));

  // Calculate balances from all expenses
  for (const expense of expenses) {
    // Payer gets credit for the full amount they paid
    const payerBalance = balanceMap.get(expense.payerClerkUserId) ?? 0;
    balanceMap.set(
      expense.payerClerkUserId,
      payerBalance + expense.amountCents
    );

    // Each split participant gets debited their share
    for (const split of expense.splits) {
      const splitBalance = balanceMap.get(split.clerkUserId) ?? 0;
      balanceMap.set(split.clerkUserId, splitBalance - split.shareCents);
    }
  }

  // Convert to array with display names
  const balances: MemberBalance[] = members.map((m) => ({
    clerkUserId: m.clerkUserId,
    displayName: m.displayNameSnapshot,
    netCents: balanceMap.get(m.clerkUserId) ?? 0,
  }));

  // Sort by absolute value (largest imbalance first)
  balances.sort((a, b) => Math.abs(b.netCents) - Math.abs(a.netCents));

  return balances;
}

/**
 * Verify that balances sum to zero (sanity check).
 * This should ALWAYS be true if calculations are correct.
 */
export function verifyBalancesSum(balances: MemberBalance[]): boolean {
  const total = balances.reduce((sum, b) => sum + b.netCents, 0);
  return total === 0;
}
