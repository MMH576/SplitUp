import { prisma } from "@/lib/prisma";
import { requireGroupMember, requireGroupAdmin } from "@/lib/auth";
import { handleApiError, apiSuccess, apiError } from "@/lib/api-utils";

type RouteParams = {
  params: Promise<{ groupId: string; memberId: string }>;
};

/**
 * DELETE /api/groups/[groupId]/members/[memberId]
 * Remove a member from the group
 * - Admin can remove any member except themselves if they're the only admin
 * - Any member can remove themselves (leave group), but not if they're the only admin
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { groupId, memberId } = await params;
    const { userId, membership } = await requireGroupMember(groupId);

    // Find the target member
    const targetMember = await prisma.groupMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember) {
      return apiError("Member not found", 404);
    }

    if (targetMember.groupId !== groupId) {
      return apiError("Member not found in this group", 404);
    }

    const isRemovingSelf = targetMember.clerkUserId === userId;
    const isAdmin = membership.role === "ADMIN";
    const isTargetAdmin = targetMember.role === "ADMIN";

    // Check authorization
    if (!isRemovingSelf && !isAdmin) {
      return apiError("Only admins can remove other members", 403);
    }

    // Check if target is the only admin
    if (isTargetAdmin) {
      const adminCount = await prisma.groupMember.count({
        where: {
          groupId,
          role: "ADMIN",
        },
      });

      if (adminCount <= 1) {
        return apiError(
          isRemovingSelf
            ? "You are the only admin. Transfer admin role to another member before leaving."
            : "Cannot remove the only admin. Transfer admin role first.",
          400
        );
      }
    }

    // Delete the member
    await prisma.groupMember.delete({
      where: { id: memberId },
    });

    return apiSuccess({
      deleted: true,
      leftGroup: isRemovingSelf,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
