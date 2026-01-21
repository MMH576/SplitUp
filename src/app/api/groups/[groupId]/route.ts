import { prisma } from "@/lib/prisma";
import { requireGroupMember, requireGroupAdmin } from "@/lib/auth";
import { handleApiError, apiSuccess, apiError } from "@/lib/api-utils";
import { updateGroupSchema } from "@/lib/validations/group";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

/**
 * GET /api/groups/[groupId]
 * Get group details (requires membership)
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const { group } = await requireGroupMember(groupId);

    const groupWithMembers = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          orderBy: { joinedAt: "asc" },
        },
        _count: {
          select: {
            expenses: true,
          },
        },
      },
    });

    return apiSuccess({
      id: group.id,
      name: group.name,
      createdAt: group.createdAt,
      members: groupWithMembers?.members.map((m) => ({
        id: m.id,
        clerkUserId: m.clerkUserId,
        displayName: m.displayNameSnapshot,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      expenseCount: groupWithMembers?._count.expenses ?? 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/groups/[groupId]
 * Update group (requires admin)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    await requireGroupAdmin(groupId);

    const body = await request.json();
    const validated = updateGroupSchema.parse(body);

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: validated,
    });

    return apiSuccess({
      id: updatedGroup.id,
      name: updatedGroup.name,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/groups/[groupId]
 * Delete group (requires admin)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    await requireGroupAdmin(groupId);

    await prisma.group.delete({
      where: { id: groupId },
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
