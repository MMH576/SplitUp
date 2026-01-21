import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserDisplayName } from "@/lib/auth";
import { handleApiError, apiSuccess } from "@/lib/api-utils";
import { createGroupSchema } from "@/lib/validations/group";
import { GroupRole } from "@prisma/client";

/**
 * GET /api/groups
 * List all groups the current user is a member of
 */
export async function GET() {
  try {
    const userId = await requireAuth();

    const memberships = await prisma.groupMember.findMany({
      where: { clerkUserId: userId },
      include: {
        group: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const groups = memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      memberCount: m.group._count.members,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return apiSuccess(groups);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/groups
 * Create a new group (creator becomes admin)
 */
export async function POST(request: Request) {
  try {
    const userId = await requireAuth();
    const body = await request.json();

    // Validate input
    const validated = createGroupSchema.parse(body);

    // Get user's display name for the membership record
    const displayName = await getUserDisplayName();

    // Create group and add creator as admin in a transaction
    const group = await prisma.$transaction(async (tx) => {
      // Create the group
      const newGroup = await tx.group.create({
        data: {
          name: validated.name,
          createdByClerkUserId: userId,
        },
      });

      // Add creator as admin member
      await tx.groupMember.create({
        data: {
          groupId: newGroup.id,
          clerkUserId: userId,
          role: GroupRole.ADMIN,
          displayNameSnapshot: displayName,
        },
      });

      return newGroup;
    });

    return apiSuccess(
      {
        id: group.id,
        name: group.name,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
