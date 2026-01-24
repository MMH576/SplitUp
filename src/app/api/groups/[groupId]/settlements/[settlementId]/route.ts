import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGroupMember, AuthorizationError } from "@/lib/auth";
import { updateSettlementSchema } from "@/lib/validations/settlement";

type RouteContext = {
  params: Promise<{ groupId: string; settlementId: string }>;
};

// PATCH /api/groups/[groupId]/settlements/[settlementId] - Update settlement status
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { groupId, settlementId } = await context.params;
    const { userId } = await requireGroupMember(groupId);

    // Find the settlement
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      return NextResponse.json(
        { error: "Settlement not found" },
        { status: 404 }
      );
    }

    // Verify the settlement belongs to this group
    if (settlement.groupId !== groupId) {
      return NextResponse.json(
        { error: "Settlement not found in this group" },
        { status: 404 }
      );
    }

    // Only the receiver can confirm the payment
    if (userId !== settlement.toClerkUserId) {
      return NextResponse.json(
        { error: "Only the receiver can confirm a payment" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateSettlementSchema.parse(body);

    const updatedSettlement = await prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: validated.status,
        settledAt: validated.status === "COMPLETED" ? new Date() : null,
      },
    });

    return NextResponse.json({ data: updatedSettlement });
  } catch (error) {
    console.error(
      "PATCH /api/groups/[groupId]/settlements/[settlementId] error:",
      error
    );

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
      { error: "Failed to update settlement" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[groupId]/settlements/[settlementId] - Delete a settlement
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { groupId, settlementId } = await context.params;
    const { userId } = await requireGroupMember(groupId);

    // Find the settlement
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      return NextResponse.json(
        { error: "Settlement not found" },
        { status: 404 }
      );
    }

    // Verify the settlement belongs to this group
    if (settlement.groupId !== groupId) {
      return NextResponse.json(
        { error: "Settlement not found in this group" },
        { status: 404 }
      );
    }

    // Only the payer or receiver can delete
    if (
      userId !== settlement.fromClerkUserId &&
      userId !== settlement.toClerkUserId
    ) {
      return NextResponse.json(
        { error: "You can only delete settlements you are involved in" },
        { status: 403 }
      );
    }

    await prisma.settlement.delete({
      where: { id: settlementId },
    });

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error(
      "DELETE /api/groups/[groupId]/settlements/[settlementId] error:",
      error
    );

    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete settlement" },
      { status: 500 }
    );
  }
}
