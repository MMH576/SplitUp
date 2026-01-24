import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserDisplayName } from "@/lib/auth";
import { handleApiError, apiSuccess, apiError } from "@/lib/api-utils";
import { GroupRole } from "@prisma/client";
import { z } from "zod";

const addFriendSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

/**
 * POST /api/friends
 * Add a friend by email. Creates a 2-person group with both users as members.
 * The friend must already be a registered user.
 */
export async function POST(request: Request) {
  try {
    const userId = await requireAuth();
    const body = await request.json();

    const { email } = addFriendSchema.parse(body);

    // Look up the user in Clerk by email
    const clerk = await clerkClient();
    const users = await clerk.users.getUserList({
      emailAddress: [email],
    });

    if (users.data.length === 0) {
      return apiError(
        "No account found with this email. They need to sign up first.",
        404
      );
    }

    const friendUser = users.data[0];
    const friendClerkId = friendUser.id;

    // Prevent adding yourself
    if (friendClerkId === userId) {
      return apiError("You can't add yourself as a friend.", 400);
    }

    // Check if a 2-person group already exists between these two users
    const existingGroups = await prisma.groupMember.findMany({
      where: { clerkUserId: userId },
      include: {
        group: {
          include: {
            members: true,
            _count: { select: { members: true } },
          },
        },
      },
    });

    const alreadyFriends = existingGroups.some((m) => {
      const group = m.group;
      return (
        group._count.members === 2 &&
        group.members.some((member) => member.clerkUserId === friendClerkId)
      );
    });

    if (alreadyFriends) {
      return apiError("You already have an expense group with this person.", 409);
    }

    // Get display names and profile pictures
    const currentUserDisplayName = await getUserDisplayName();
    const currentClerkUser = await currentUser();
    const currentUserImageUrl = currentClerkUser?.imageUrl || null;
    const friendDisplayName =
      friendUser.firstName && friendUser.lastName
        ? `${friendUser.firstName} ${friendUser.lastName}`
        : friendUser.firstName
          ? friendUser.firstName
          : email.split("@")[0];
    const friendImageUrl = friendUser.imageUrl || null;

    // Create the group with both members
    const group = await prisma.$transaction(async (tx) => {
      // Use friend's name as the group name (what the current user sees)
      const newGroup = await tx.group.create({
        data: {
          name: friendDisplayName,
          createdByClerkUserId: userId,
        },
      });

      // Add current user as admin
      await tx.groupMember.create({
        data: {
          groupId: newGroup.id,
          clerkUserId: userId,
          role: GroupRole.ADMIN,
          displayNameSnapshot: currentUserDisplayName,
          imageUrl: currentUserImageUrl,
        },
      });

      // Add friend as member
      await tx.groupMember.create({
        data: {
          groupId: newGroup.id,
          clerkUserId: friendClerkId,
          role: GroupRole.MEMBER,
          displayNameSnapshot: friendDisplayName,
          imageUrl: friendImageUrl,
        },
      });

      return newGroup;
    });

    return apiSuccess(
      {
        id: group.id,
        name: group.name,
        friendName: friendDisplayName,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
