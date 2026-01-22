import { prisma } from "@/lib/prisma";
import { requireGroupMember } from "@/lib/auth";
import { handleApiError, apiSuccess, apiError } from "@/lib/api-utils";
import { createExpenseSchema } from "@/lib/validations/expense";
import {
  calculateEqualSplit,
  processCustomSplits,
  verifySplitsTotal,
} from "@/lib/utils/splits";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

/**
 * GET /api/groups/[groupId]/expenses
 * List all expenses in a group (requires membership)
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    await requireGroupMember(groupId);

    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: {
        splits: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(
      expenses.map((e) => ({
        id: e.id,
        title: e.title,
        amountCents: e.amountCents,
        payerClerkUserId: e.payerClerkUserId,
        splitType: e.splitType,
        category: e.category,
        expenseDate: e.expenseDate,
        createdAt: e.createdAt,
        splits: e.splits.map((s) => ({
          clerkUserId: s.clerkUserId,
          shareCents: s.shareCents,
        })),
      }))
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/groups/[groupId]/expenses
 * Create a new expense with equal or custom split (requires membership)
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    await requireGroupMember(groupId);

    const body = await request.json();
    const validated = createExpenseSchema.parse(body);

    // Verify payer is a group member
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

    // Get participant IDs based on split type
    const participantIds =
      validated.splitType === "EQUAL"
        ? validated.participantIds
        : validated.customSplits.map((s) => s.clerkUserId);

    // Verify all participants are group members
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

    // For CUSTOM splits, calculate total from individual amounts
    // For EQUAL splits, use the provided amount
    let finalAmountCents: number;
    let splits;

    if (validated.splitType === "EQUAL") {
      finalAmountCents = validated.amountCents;
      splits = calculateEqualSplit(finalAmountCents, validated.participantIds);
    } else {
      // Auto-calculate total from custom splits
      finalAmountCents = validated.customSplits.reduce(
        (sum, s) => sum + s.shareCents,
        0
      );
      splits = processCustomSplits(finalAmountCents, validated.customSplits);
    }

    // Verify splits sum correctly (sanity check)
    if (!verifySplitsTotal(splits, finalAmountCents)) {
      return apiError("Split calculation error - amounts don't match", 500);
    }

    // Create expense and splits in a transaction
    const expense = await prisma.$transaction(async (tx) => {
      // Create the expense
      const newExpense = await tx.expense.create({
        data: {
          groupId,
          title: validated.title,
          amountCents: finalAmountCents,
          payerClerkUserId: validated.payerClerkUserId,
          splitType: validated.splitType,
          category: validated.category,
          expenseDate: validated.expenseDate
            ? new Date(validated.expenseDate)
            : new Date(),
        },
      });

      // Create the splits
      await tx.expenseSplit.createMany({
        data: splits.map((split) => ({
          expenseId: newExpense.id,
          clerkUserId: split.clerkUserId,
          shareCents: split.shareCents,
        })),
      });

      // Return expense with splits
      return tx.expense.findUnique({
        where: { id: newExpense.id },
        include: { splits: true },
      });
    });

    return apiSuccess(
      {
        id: expense!.id,
        title: expense!.title,
        amountCents: expense!.amountCents,
        payerClerkUserId: expense!.payerClerkUserId,
        splitType: expense!.splitType,
        splits: expense!.splits.map((s) => ({
          clerkUserId: s.clerkUserId,
          shareCents: s.shareCents,
        })),
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
