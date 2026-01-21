import { prisma } from "@/lib/prisma";
import { requireGroupMember } from "@/lib/auth";
import { handleApiError, apiSuccess } from "@/lib/api-utils";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

/**
 * GET /api/groups/[groupId]/members
 * List all members of a group (requires membership)
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    await requireGroupMember(groupId);

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      orderBy: { joinedAt: "asc" },
    });

    return apiSuccess(
      members.map((m) => ({
        id: m.id,
        clerkUserId: m.clerkUserId,
        displayName: m.displayNameSnapshot,
        role: m.role,
        joinedAt: m.joinedAt,
      }))
    );
  } catch (error) {
    return handleApiError(error);
  }
}
