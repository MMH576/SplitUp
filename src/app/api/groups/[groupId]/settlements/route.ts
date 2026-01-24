import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGroupMember, AuthorizationError } from "@/lib/auth";
import { createSettlementSchema } from "@/lib/validations/settlement";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

// GET /api/groups/[groupId]/settlements - List all settlements for a group
export async function GET(request: Request, context: RouteContext) {
  try {
    const { groupId } = await context.params;
    await requireGroupMember(groupId);

    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
    });

    // Get member display names for the settlements
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      select: { clerkUserId: true, displayNameSnapshot: true },
    });

    const memberMap = new Map(
      members.map((m) => [m.clerkUserId, m.displayNameSnapshot])
    );

    const settlementsWithNames = settlements.map((s) => ({
      ...s,
      fromDisplayName: memberMap.get(s.fromClerkUserId) ?? "Unknown",
      toDisplayName: memberMap.get(s.toClerkUserId) ?? "Unknown",
    }));

    return NextResponse.json({ data: settlementsWithNames });
  } catch (error) {
    console.error("GET /api/groups/[groupId]/settlements error:", error);

    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch settlements" },
      { status: 500 }
    );
  }
}

// POST /api/groups/[groupId]/settlements - Create a new settlement record
export async function POST(request: Request, context: RouteContext) {
  try {
    const { groupId } = await context.params;
    const { userId } = await requireGroupMember(groupId);

    const body = await request.json();
    const validated = createSettlementSchema.parse(body);

    // Verify both users are members of the group
    const [fromMember, toMember] = await Promise.all([
      prisma.groupMember.findUnique({
        where: {
          groupId_clerkUserId: {
            groupId,
            clerkUserId: validated.fromClerkUserId,
          },
        },
      }),
      prisma.groupMember.findUnique({
        where: {
          groupId_clerkUserId: {
            groupId,
            clerkUserId: validated.toClerkUserId,
          },
        },
      }),
    ]);

    if (!fromMember || !toMember) {
      return NextResponse.json(
        { error: "Both users must be members of the group" },
        { status: 400 }
      );
    }

    // Only the person paying can initiate "Mark Paid"
    if (userId !== validated.fromClerkUserId) {
      return NextResponse.json(
        { error: "Only the person who paid can mark a payment" },
        { status: 403 }
      );
    }

    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        fromClerkUserId: validated.fromClerkUserId,
        toClerkUserId: validated.toClerkUserId,
        amountCents: validated.amountCents,
        status: "PENDING",
        initiatedByClerkUserId: userId,
      },
    });

    return NextResponse.json({ data: settlement }, { status: 201 });
  } catch (error) {
    console.error("POST /api/groups/[groupId]/settlements error:", error);

    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create settlement" },
      { status: 500 }
    );
  }
}
