import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { GroupRole } from "@prisma/client";

// ============================================
// CUSTOM ERROR CLASSES
// ============================================

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

// ============================================
// AUTH UTILITIES
// ============================================

/**
 * Requires the user to be authenticated.
 * Returns the Clerk user ID.
 * Throws AuthorizationError if not authenticated.
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new AuthorizationError("Unauthorized - Please sign in", 401);
  }

  return userId;
}

/**
 * Gets the current user's display name from Clerk.
 * Falls back to email or "Unknown User" if name not available.
 */
export async function getUserDisplayName(): Promise<string> {
  const user = await currentUser();

  if (!user) {
    return "Unknown User";
  }

  // Try full name first, then first name, then email, then fallback
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  if (user.firstName) {
    return user.firstName;
  }

  if (user.emailAddresses?.[0]?.emailAddress) {
    return user.emailAddresses[0].emailAddress.split("@")[0];
  }

  return "Unknown User";
}

// ============================================
// GROUP AUTHORIZATION
// ============================================

/**
 * Requires the current user to be a member of the specified group.
 * Returns user ID and membership record.
 * Throws AuthorizationError if not a member.
 */
export async function requireGroupMember(groupId: string) {
  const userId = await requireAuth();

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_clerkUserId: {
        groupId,
        clerkUserId: userId,
      },
    },
    include: {
      group: true,
    },
  });

  if (!membership) {
    throw new AuthorizationError("You are not a member of this group", 403);
  }

  return {
    userId,
    membership,
    group: membership.group,
    isAdmin: membership.role === GroupRole.ADMIN,
  };
}

/**
 * Requires the current user to be an admin of the specified group.
 * Returns user ID and membership record.
 * Throws AuthorizationError if not an admin.
 */
export async function requireGroupAdmin(groupId: string) {
  const result = await requireGroupMember(groupId);

  if (result.membership.role !== GroupRole.ADMIN) {
    throw new AuthorizationError("Admin access required", 403);
  }

  return result;
}

/**
 * Checks if a user is a member of a group (non-throwing version).
 * Useful for conditional UI rendering.
 */
export async function isGroupMember(
  groupId: string,
  clerkUserId: string
): Promise<boolean> {
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_clerkUserId: {
        groupId,
        clerkUserId,
      },
    },
  });

  return !!membership;
}

/**
 * Gets all members of a group (requires membership).
 * Returns array of group members with their details.
 */
export async function getGroupMembers(groupId: string) {
  // First verify the caller is a member
  await requireGroupMember(groupId);

  return prisma.groupMember.findMany({
    where: { groupId },
    orderBy: { joinedAt: "asc" },
  });
}
