/**
 * Equal Split Calculation Utility
 *
 * Handles the math of splitting an expense equally among participants.
 * Uses integer cents to avoid floating point errors.
 *
 * Example: $10.00 (1000 cents) split 3 ways:
 * - Base share: floor(1000/3) = 333 cents
 * - Remainder: 1000 % 3 = 1 cent
 * - Result: [334, 333, 333] cents (first person gets extra cent)
 * - Sum: 334 + 333 + 333 = 1000 ✓
 */

export interface SplitResult {
  clerkUserId: string;
  shareCents: number;
}

/**
 * Calculate equal split for an expense.
 * Distributes remainder cents to first N participants (sorted for determinism).
 *
 * @param amountCents - Total amount in cents (must be positive integer)
 * @param participantIds - Array of Clerk user IDs to split among
 * @returns Array of split results, one per participant
 * @throws Error if no participants or invalid amount
 */
export function calculateEqualSplit(
  amountCents: number,
  participantIds: string[]
): SplitResult[] {
  if (participantIds.length === 0) {
    throw new Error("At least one participant is required");
  }

  if (amountCents <= 0 || !Number.isInteger(amountCents)) {
    throw new Error("Amount must be a positive integer");
  }

  const n = participantIds.length;
  const baseShare = Math.floor(amountCents / n);
  const remainder = amountCents % n;

  // Sort IDs for deterministic remainder distribution
  const sortedIds = [...participantIds].sort();

  return sortedIds.map((id, index) => ({
    clerkUserId: id,
    // First 'remainder' participants get +1 cent
    shareCents: baseShare + (index < remainder ? 1 : 0),
  }));
}

/**
 * Verify that splits sum to the expected total.
 * Use this as a sanity check after calculating splits.
 */
export function verifySplitsTotal(
  splits: SplitResult[],
  expectedTotal: number
): boolean {
  const actualTotal = splits.reduce((sum, split) => sum + split.shareCents, 0);
  return actualTotal === expectedTotal;
}
