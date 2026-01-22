"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
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
};

export function ExpenseCard({
  expense,
  groupId,
  members,
  currentUserId,
}: ExpenseCardProps) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const payer = members.find((m) => m.clerkUserId === expense.payerClerkUserId);

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
              <CardTitle className="text-base truncate">{expense.title}</CardTitle>
              <CardDescription>
                Paid by {payer?.displayName ?? "Unknown"} ·{" "}
                {expense.splits.length}{" "}
                {expense.splits.length === 1 ? "person" : "people"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="font-semibold">
                  {formatMoney(expense.amountCents)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(expense.expenseDate).toLocaleDateString()}
                </div>
              </div>
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

      {/* Edit Dialog */}
      <EditExpenseDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        expense={expense}
        groupId={groupId}
        members={members}
        currentUserId={currentUserId}
      />

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
