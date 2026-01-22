import { prisma } from "@/lib/prisma";
import { requireGroupMember } from "@/lib/auth";
import { handleApiError, apiSuccess, apiError } from "@/lib/api-utils";
import { createExpenseSchema } from "@/lib/validations/expense";
import { calculateEqualSplit, verifySplitsTotal } from "@/lib/utils/splits";

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
 * Create a new expense with equal split (requires membership)
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { groupId } = await params;
    const { userId } = await requireGroupMember(groupId);

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

    // Verify all participants are group members
    const participantMemberships = await prisma.groupMember.findMany({
      where: {
        groupId,
        clerkUserId: { in: validated.participantIds },
      },
    });

    if (participantMemberships.length !== validated.participantIds.length) {
      return apiError("One or more participants are not members of this group", 400);
    }

    // Calculate equal split
    const splits = calculateEqualSplit(
      validated.amountCents,
      validated.participantIds
    );

    // Verify splits sum correctly (sanity check)
    if (!verifySplitsTotal(splits, validated.amountCents)) {
      return apiError("Split calculation error - amounts don't match", 500);
    }

    // Create expense and splits in a transaction
    const expense = await prisma.$transaction(async (tx) => {
      // Create the expense
      const newExpense = await tx.expense.create({
        data: {
          groupId,
          title: validated.title,
          amountCents: validated.amountCents,
          payerClerkUserId: validated.payerClerkUserId,
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
