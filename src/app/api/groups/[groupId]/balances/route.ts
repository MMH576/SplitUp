import { requireGroupMember } from "@/lib/auth";
import { handleApiError, apiSuccess } from "@/lib/api-utils";
import {
  calculateGroupBalances,
  verifyBalancesSum,
} from "@/lib/utils/balances";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

/**
 * GET /api/groups/[groupId]/balances
 * Get net balances for all members in the group (requires membership)
 *
 * Response:
 * {
 *   balances: [
 *     { clerkUserId: "...", displayName: "Alice", netCents: 3000 },  // owed $30
 *     { clerkUserId: "...", displayName: "Bob", netCents: -1500 },   // owes $15
 *     { clerkUserId: "...", displayName: "Carol", netCents: -1500 }, // owes $15
 *   ],
 *   totalExpenses: 3,
 *   isBalanced: true  // sanity check: sum of all balances = 0
 * }
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    await requireGroupMember(groupId);

    const balances = await calculateGroupBalances(groupId);
    const isBalanced = verifyBalancesSum(balances);

    // Log warning if balances don't sum to zero (should never happen)
    if (!isBalanced) {
      console.error(
        `[BALANCE ERROR] Group ${groupId} balances don't sum to zero!`
      );
    }

    return apiSuccess({
      balances: balances.map((b) => ({
        clerkUserId: b.clerkUserId,
        displayName: b.displayName,
        netCents: b.netCents,
      })),
      isBalanced,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
