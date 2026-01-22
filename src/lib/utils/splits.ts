/**
 * Split Calculation Utilities
 *
 * Handles the math of splitting expenses among participants.
 * Supports both equal splits and custom amount splits.
 * Uses integer cents to avoid floating point errors.
 *
 * Example (Equal): $10.00 (1000 cents) split 3 ways:
 * - Base share: floor(1000/3) = 333 cents
 * - Remainder: 1000 % 3 = 1 cent
 * - Result: [334, 333, 333] cents (first person gets extra cent)
 * - Sum: 334 + 333 + 333 = 1000 ✓
 *
 * Example (Custom): $100.00 groceries paid by Alice:
 * - Alice's items: $40.00 (4000 cents)
 * - Bob's items: $35.00 (3500 cents)
 * - Carol's items: $25.00 (2500 cents)
 * - Sum: 4000 + 3500 + 2500 = 10000 ✓
 */

export interface SplitResult {
  clerkUserId: string;
  shareCents: number;
}

export interface CustomSplitInput {
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
 * Process custom splits for an expense.
 * Validates that splits sum to the expected total.
 *
 * @param amountCents - Total amount in cents (must be positive integer)
 * @param customSplits - Array of custom split entries with userId and amount
 * @returns Array of split results
 * @throws Error if splits don't sum to total or invalid data
 */
export function processCustomSplits(
  amountCents: number,
  customSplits: CustomSplitInput[]
): SplitResult[] {
  if (customSplits.length === 0) {
    throw new Error("At least one participant is required");
  }

  if (amountCents <= 0 || !Number.isInteger(amountCents)) {
    throw new Error("Amount must be a positive integer");
  }

  // Validate each split
  for (const split of customSplits) {
    if (split.shareCents < 0 || !Number.isInteger(split.shareCents)) {
      throw new Error("Each share must be a non-negative integer");
    }
  }

  // Verify sum equals total
  const totalSplits = customSplits.reduce((sum, s) => sum + s.shareCents, 0);
  if (totalSplits !== amountCents) {
    throw new Error(
      `Custom splits (${totalSplits}) must equal total amount (${amountCents})`
    );
  }

  // Check for duplicate user IDs
  const userIds = customSplits.map((s) => s.clerkUserId);
  const uniqueIds = new Set(userIds);
  if (uniqueIds.size !== userIds.length) {
    throw new Error("Duplicate participant IDs are not allowed");
  }

  return customSplits.map((split) => ({
    clerkUserId: split.clerkUserId,
    shareCents: split.shareCents,
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
