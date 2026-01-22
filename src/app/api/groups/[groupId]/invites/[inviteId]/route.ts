import { prisma } from "@/lib/prisma";
import { requireGroupAdmin } from "@/lib/auth";
import { handleApiError, apiSuccess, apiError } from "@/lib/api-utils";

type RouteParams = {
  params: Promise<{ groupId: string; inviteId: string }>;
};

/**
 * DELETE /api/groups/[groupId]/invites/[inviteId]
 * Revoke an invite (requires admin)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { groupId, inviteId } = await params;
    await requireGroupAdmin(groupId);

    const invite = await prisma.groupInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      return apiError("Invite not found", 404);
    }

    if (invite.groupId !== groupId) {
      return apiError("Invite not found in this group", 404);
    }

    await prisma.groupInvite.delete({
      where: { id: inviteId },
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
