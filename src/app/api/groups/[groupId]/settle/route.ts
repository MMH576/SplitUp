import { requireGroupMember } from "@/lib/auth";
import { handleApiError, apiSuccess } from "@/lib/api-utils";
import { calculateGroupBalances } from "@/lib/utils/balances";
import {
  calculateSettlements,
  verifySettlements,
  formatSettlementSummary,
} from "@/lib/utils/settlements";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

/**
 * GET /api/groups/[groupId]/settle
 * Get the optimized settlement plan for the group (requires membership)
 *
 * Response:
 * {
 *   transfers: [
 *     {
 *       fromClerkUserId: "...",
 *       fromDisplayName: "Bob",
 *       toClerkUserId: "...",
 *       toDisplayName: "Alice",
 *       amountCents: 2000
 *     }
 *   ],
 *   summary: "Bob pays Alice $20.00",
 *   isValid: true  // sanity check: all transfers settle to 0
 * }
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    await requireGroupMember(groupId);

    // First get balances
    const balances = await calculateGroupBalances(groupId);

    // Calculate optimal settlement plan
    const transfers = calculateSettlements(balances);

    // Verify the settlement plan is correct (sanity check)
    const isValid = verifySettlements(balances, transfers);

    // Log warning if settlements don't verify (should never happen)
    if (!isValid) {
      console.error(
        `[SETTLEMENT ERROR] Group ${groupId} settlement plan doesn't verify!`
      );
    }

    // Generate human-readable summary
    const summary = formatSettlementSummary(transfers);

    return apiSuccess({
      transfers: transfers.map((t) => ({
        fromClerkUserId: t.fromClerkUserId,
        fromDisplayName: t.fromDisplayName,
        toClerkUserId: t.toClerkUserId,
        toDisplayName: t.toDisplayName,
        amountCents: t.amountCents,
      })),
      summary,
      isValid,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
