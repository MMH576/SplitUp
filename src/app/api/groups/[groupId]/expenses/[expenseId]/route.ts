import { prisma } from "@/lib/prisma";
import { requireGroupMember } from "@/lib/auth";
import { handleApiError, apiSuccess, apiError } from "@/lib/api-utils";
import { updateExpenseSchema } from "@/lib/validations/expense";
import {
  calculateEqualSplit,
  processCustomSplits,
  verifySplitsTotal,
} from "@/lib/utils/splits";

type RouteParams = {
  params: Promise<{ groupId: string; expenseId: string }>;
};

/**
 * GET /api/groups/[groupId]/expenses/[expenseId]
 * Get a single expense with its splits (requires membership)
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { groupId, expenseId } = await params;
    await requireGroupMember(groupId);

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        splits: true,
      },
    });

    if (!expense) {
      return apiError("Expense not found", 404);
    }

    if (expense.groupId !== groupId) {
      return apiError("Expense not found in this group", 404);
    }

    // Get member display names for the splits
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      select: { clerkUserId: true, displayNameSnapshot: true },
    });

    const memberMap = new Map(
      members.map((m) => [m.clerkUserId, m.displayNameSnapshot])
    );

    return apiSuccess({
      id: expense.id,
      title: expense.title,
      amountCents: expense.amountCents,
      payerClerkUserId: expense.payerClerkUserId,
      payerDisplayName: memberMap.get(expense.payerClerkUserId) ?? "Unknown",
      splitType: expense.splitType,
      category: expense.category,
      expenseDate: expense.expenseDate.toISOString(),
      createdAt: expense.createdAt.toISOString(),
      splits: expense.splits.map((s) => ({
        clerkUserId: s.clerkUserId,
        displayName: memberMap.get(s.clerkUserId) ?? "Unknown",
        shareCents: s.shareCents,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/groups/[groupId]/expenses/[expenseId]
 * Update an expense (requires membership)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { groupId, expenseId } = await params;
    const { userId } = await requireGroupMember(groupId);

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { splits: true },
    });

    if (!expense) {
      return apiError("Expense not found", 404);
    }

    if (expense.groupId !== groupId) {
      return apiError("Expense not found in this group", 404);
    }

    // Only the expense creator (payer) can edit
    if (expense.payerClerkUserId !== userId) {
      return apiError("Only the person who created this expense can edit it", 403);
    }

    const body = await request.json();
    const validated = updateExpenseSchema.parse(body);

    // If payer is being changed, verify they're a group member
    if (validated.payerClerkUserId) {
      const payerMembership = await prisma.groupMember.findUnique({
        where: {
          groupId_clerkUserId: {
            groupId,
            clerkUserId: validated.payerClerkUserId,
          },
        },
      });

      if (!payerMembership) {
        return apiError("Payer is not a member of this group", 400);
      }
    }

    // Determine participant IDs based on split type
    let participantIds: string[] | undefined;
    if (validated.splitType === "EQUAL" && validated.participantIds) {
      participantIds = validated.participantIds;
    } else if (validated.splitType === "CUSTOM" && validated.customSplits) {
      participantIds = validated.customSplits.map((s) => s.clerkUserId);
    }

    // Verify participants are group members if specified
    if (participantIds) {
      const participantMemberships = await prisma.groupMember.findMany({
        where: {
          groupId,
          clerkUserId: { in: participantIds },
        },
      });

      if (participantMemberships.length !== participantIds.length) {
        return apiError(
          "One or more participants are not members of this group",
          400
        );
      }
    }

    const finalSplitType = validated.splitType;

    // Check if splits need recalculation
    const needsRecalculation =
      validated.amountCents !== undefined ||
      (validated.splitType === "EQUAL" && validated.participantIds) ||
      (validated.splitType === "CUSTOM" && validated.customSplits);

    if (needsRecalculation) {
      let splits;
      let finalAmountCents: number;

      if (validated.splitType === "EQUAL") {
        // For EQUAL: use provided amount or existing
        finalAmountCents = validated.amountCents ?? expense.amountCents;
        const finalParticipantIds =
          validated.participantIds ??
          expense.splits.map((s) => s.clerkUserId);
        splits = calculateEqualSplit(finalAmountCents, finalParticipantIds);
      } else {
        // CUSTOM split - auto-calculate total from splits
        if (!validated.customSplits) {
          return apiError(
            "Custom splits are required for CUSTOM split type",
            400
          );
        }
        // Calculate total from individual splits
        finalAmountCents = validated.customSplits.reduce(
          (sum, s) => sum + s.shareCents,
          0
        );
        splits = processCustomSplits(finalAmountCents, validated.customSplits);
      }

      if (!verifySplitsTotal(splits, finalAmountCents)) {
        return apiError("Split calculation error - amounts don't match", 500);
      }

      // Update expense and splits in a transaction
      const updatedExpense = await prisma.$transaction(async (tx) => {
        // Update the expense
        await tx.expense.update({
          where: { id: expenseId },
          data: {
            title: validated.title,
            amountCents: finalAmountCents,
            payerClerkUserId: validated.payerClerkUserId,
            splitType: finalSplitType,
            category: validated.category,
            expenseDate: validated.expenseDate
              ? new Date(validated.expenseDate)
              : undefined,
          },
        });

        // Delete old splits and create new ones
        await tx.expenseSplit.deleteMany({
          where: { expenseId },
        });

        await tx.expenseSplit.createMany({
          data: splits.map((split) => ({
            expenseId,
            clerkUserId: split.clerkUserId,
            shareCents: split.shareCents,
          })),
        });

        return tx.expense.findUnique({
          where: { id: expenseId },
          include: { splits: true },
        });
      });

      return apiSuccess({
        id: updatedExpense!.id,
        title: updatedExpense!.title,
        amountCents: updatedExpense!.amountCents,
        payerClerkUserId: updatedExpense!.payerClerkUserId,
        splitType: updatedExpense!.splitType,
        splits: updatedExpense!.splits.map((s) => ({
          clerkUserId: s.clerkUserId,
          shareCents: s.shareCents,
        })),
      });
    }

    // Simple update without split recalculation
    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        title: validated.title,
        payerClerkUserId: validated.payerClerkUserId,
        splitType: finalSplitType,
        category: validated.category,
        expenseDate: validated.expenseDate
          ? new Date(validated.expenseDate)
          : undefined,
      },
      include: { splits: true },
    });

    return apiSuccess({
      id: updatedExpense.id,
      title: updatedExpense.title,
      amountCents: updatedExpense.amountCents,
      payerClerkUserId: updatedExpense.payerClerkUserId,
      splitType: updatedExpense.splitType,
      splits: updatedExpense.splits.map((s) => ({
        clerkUserId: s.clerkUserId,
        shareCents: s.shareCents,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/groups/[groupId]/expenses/[expenseId]
 * Delete an expense and its splits (requires membership)
 * Note: Splits are deleted via cascade
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { groupId, expenseId } = await params;
    const { userId } = await requireGroupMember(groupId);

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      return apiError("Expense not found", 404);
    }

    if (expense.groupId !== groupId) {
      return apiError("Expense not found in this group", 404);
    }

    // Only the expense creator (payer) can delete
    if (expense.payerClerkUserId !== userId) {
      return apiError("Only the person who created this expense can delete it", 403);
    }

    // Delete expense (splits are deleted via cascade)
    await prisma.expense.delete({
      where: { id: expenseId },
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
