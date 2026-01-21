import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { handleApiError, apiSuccess, apiError } from "@/lib/api-utils";

type RouteParams = {
  params: Promise<{ token: string }>;
};

/**
 * GET /api/invites/[token]
 * Validate an invite token and return group info
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    await requireAuth();

    const invite = await prisma.groupInvite.findUnique({
      where: { token },
      include: {
        group: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });

    if (!invite) {
      return apiError("Invalid invite link", 404);
    }

    if (invite.expiresAt < new Date()) {
      return apiError("This invite link has expired", 410);
    }

    return apiSuccess({
      groupId: invite.group.id,
      groupName: invite.group.name,
      memberCount: invite.group._count.members,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
