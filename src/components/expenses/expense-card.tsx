"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Eye, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatMoney } from "@/lib/utils/money";
import { toast } from "sonner";
import { ExpenseDetailsDialog } from "./expense-details-dialog";
import { EditExpenseDialog } from "./edit-expense-dialog";

type Split = {
  clerkUserId: string;
  shareCents: number;
};

type Member = {
  id: string;
  clerkUserId: string;
  displayName: string;
};

type SplitType = "EQUAL" | "CUSTOM";

type SettlementRecord = {
  fromClerkUserId: string;
  toClerkUserId: string;
  amountCents: number;
};

type ExpenseCardProps = {
  expense: {
    id: string;
    title: string;
    amountCents: number;
    payerClerkUserId: string;
    expenseDate: Date;
    splitType?: SplitType;
    splits: Split[];
  };
  groupId: string;
  members: Member[];
  currentUserId: string;
  settlements?: SettlementRecord[];
};

export function ExpenseCard({
  expense,
  groupId,
  members,
  currentUserId,
  settlements = [],
}: ExpenseCardProps) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCreator = expense.payerClerkUserId === currentUserId;
  const payer = members.find((m) => m.clerkUserId === expense.payerClerkUserId);
  const userSplit = expense.splits.find((s) => s.clerkUserId === currentUserId);

  // Calculate if the expense is fully settled
  const isFullySettled = (() => {
    const debtors = expense.splits.filter(
      (s) => s.clerkUserId !== expense.payerClerkUserId && s.shareCents > 0
    );
    if (debtors.length === 0) return true;

    return debtors.every((debtor) => {
      const totalSettled = settlements
        .filter(
          (s) =>
            s.fromClerkUserId === debtor.clerkUserId &&
            s.toClerkUserId === expense.payerClerkUserId
        )
        .reduce((sum, s) => sum + s.amountCents, 0);
      return totalSettled >= debtor.shareCents;
    });
  })();

  // Determine what amount and label to show
  const getAmountDisplay = () => {
    if (isCreator) {
      const payerSplit = expense.splits.find(
        (s) => s.clerkUserId === expense.payerClerkUserId
      );
      const expectedBack = expense.amountCents - (payerSplit?.shareCents ?? 0);
      return {
        amount: formatMoney(expense.amountCents),
        label: expectedBack > 0 ? `Get back ${formatMoney(expectedBack)}` : "You paid",
        colorClass: expectedBack > 0 ? "text-green-600" : "",
      };
    } else if (userSplit && userSplit.shareCents > 0) {
      return {
        amount: formatMoney(userSplit.shareCents),
        label: `You owe ${payer?.displayName ?? ""}`,
        colorClass: "text-red-600",
      };
    } else {
      return {
        amount: "",
        label: "",
        colorClass: "",
      };
    }
  };

  const amountDisplay = getAmountDisplay();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/groups/${groupId}/expenses/${expense.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete expense");
      }

      toast.success("Expense deleted");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete expense"
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base truncate">{expense.title}</CardTitle>
                {isFullySettled && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">
                    <CheckCircle2 className="h-3 w-3" />
                    Settled
                  </span>
                )}
              </div>
              <CardDescription>
                {isCreator ? (
                  <>You paid · {new Date(expense.expenseDate).toLocaleDateString()}</>
                ) : (
                  <>Paid by {payer?.displayName ?? "Unknown"} · {new Date(expense.expenseDate).toLocaleDateString()}</>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {amountDisplay.amount && (
                <div className="text-right">
                  <div className={`font-semibold ${amountDisplay.colorClass}`}>
                    {amountDisplay.amount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {amountDisplay.label}
                  </div>
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowDetails(true)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View details
                  </DropdownMenuItem>
                  {isCreator && (
                    <>
                      <DropdownMenuItem onClick={() => setShowEdit(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* View Details Dialog */}
      <ExpenseDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        expense={expense}
        members={members}
        currentUserId={currentUserId}
      />

      {/* Edit Dialog - only rendered for creator */}
      {isCreator && (
        <EditExpenseDialog
          open={showEdit}
          onOpenChange={setShowEdit}
          expense={expense}
          groupId={groupId}
          members={members}
          currentUserId={currentUserId}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{expense.title}&quot; (
              {formatMoney(expense.amountCents)}) and recalculate all balances.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
