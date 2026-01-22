import { prisma } from "@/lib/prisma";
import { requireGroupAdmin } from "@/lib/auth";
import { handleApiError, apiSuccess } from "@/lib/api-utils";
import { createInviteSchema } from "@/lib/validations/invite";
import { randomBytes } from "crypto";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

/**
 * POST /api/groups/[groupId]/invites
 * Create an invite link (requires admin)
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const { userId } = await requireGroupAdmin(groupId);

    const body = await request.json().catch(() => ({}));
    const validated = createInviteSchema.parse(body);

    // Generate a secure random token
    const token = randomBytes(32).toString("hex");

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validated.expiresInDays);

    const invite = await prisma.groupInvite.create({
      data: {
        groupId,
        token,
        expiresAt,
        createdByClerkUserId: userId,
      },
    });

    return apiSuccess(
      {
        id: invite.id,
        token: invite.token,
        expiresAt: invite.expiresAt,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/groups/[groupId]/invites
 * List active invites (requires admin)
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    await requireGroupAdmin(groupId);

    const invites = await prisma.groupInvite.findMany({
      where: {
        groupId,
        expiresAt: { gt: new Date() }, // Only active invites
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(
      invites.map((i) => ({
        id: i.id,
        token: i.token,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
      }))
    );
  } catch (error) {
    return handleApiError(error);
  }
}
