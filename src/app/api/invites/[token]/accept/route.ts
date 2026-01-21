import { prisma } from "@/lib/prisma";
import { requireAuth, getUserDisplayName } from "@/lib/auth";
import { handleApiError, apiSuccess, apiError } from "@/lib/api-utils";
import { GroupRole } from "@prisma/client";

type RouteParams = {
  params: Promise<{ token: string }>;
};

/**
 * POST /api/invites/[token]/accept
 * Accept an invite and join the group
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const userId = await requireAuth();

    const invite = await prisma.groupInvite.findUnique({
      where: { token },
      include: { group: true },
    });

    if (!invite) {
      return apiError("Invalid invite link", 404);
    }

    if (invite.expiresAt < new Date()) {
      return apiError("This invite link has expired", 410);
    }

    // Check if user is already a member
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_clerkUserId: {
          groupId: invite.groupId,
          clerkUserId: userId,
        },
      },
    });

    if (existingMembership) {
      // Already a member, just return success
      return apiSuccess({
        groupId: invite.groupId,
        groupName: invite.group.name,
        alreadyMember: true,
      });
    }

    // Get user's display name
    const displayName = await getUserDisplayName();

    // Add user to group
    await prisma.groupMember.create({
      data: {
        groupId: invite.groupId,
        clerkUserId: userId,
        role: GroupRole.MEMBER,
        displayNameSnapshot: displayName,
      },
    });

    return apiSuccess({
      groupId: invite.groupId,
      groupName: invite.group.name,
      alreadyMember: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
