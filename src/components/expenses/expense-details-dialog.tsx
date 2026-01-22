"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/utils/money";

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

type ExpenseDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: {
    id: string;
    title: string;
    amountCents: number;
    payerClerkUserId: string;
    expenseDate: Date;
    splitType?: SplitType;
    splits: Split[];
  };
  members: Member[];
  currentUserId: string;
};

export function ExpenseDetailsDialog({
  open,
  onOpenChange,
  expense,
  members,
  currentUserId,
}: ExpenseDetailsDialogProps) {
  const payer = members.find((m) => m.clerkUserId === expense.payerClerkUserId);
  const isCurrentUserPayer = expense.payerClerkUserId === currentUserId;

  // Map splits with member names
  const splitsWithNames = expense.splits.map((split) => {
    const member = members.find((m) => m.clerkUserId === split.clerkUserId);
    return {
      ...split,
      displayName: member?.displayName ?? "Unknown",
      isCurrentUser: split.clerkUserId === currentUserId,
      isPayer: split.clerkUserId === expense.payerClerkUserId,
    };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{expense.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount and Date */}
          <div className="flex justify-between items-center py-3 border-b">
            <div>
              <p className="text-2xl font-bold">
                {formatMoney(expense.amountCents)}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(expense.expenseDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Paid By */}
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-1">Paid by</p>
            <p className="font-medium">
              {payer?.displayName ?? "Unknown"}
              {isCurrentUserPayer && (
                <span className="text-muted-foreground font-normal"> (you)</span>
              )}
            </p>
          </div>

          {/* Split Breakdown */}
          <div className="py-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">
                Split between {expense.splits.length}{" "}
                {expense.splits.length === 1 ? "person" : "people"}
              </p>
              {expense.splitType && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    expense.splitType === "CUSTOM"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {expense.splitType === "CUSTOM" ? "Custom split" : "Equal split"}
                </span>
              )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {splitsWithNames.map((split) => (
                <div
                  key={split.clerkUserId}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span>
                    {split.displayName}
                    {split.isCurrentUser && (
                      <span className="text-muted-foreground"> (you)</span>
                    )}
                  </span>
                  <div className="text-right">
                    <span className="font-medium">
                      {formatMoney(split.shareCents)}
                    </span>
                    {split.isPayer ? (
                      <p className="text-xs text-muted-foreground">paid</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        owes {payer?.displayName?.split(" ")[0] ?? "payer"}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Net Effect for Payer */}
          {expense.splits.length > 1 && (
            <div className="py-3 border-t bg-muted/50 rounded-md px-3 -mx-1">
              <div className="flex justify-between items-center">
                <span className="text-sm">
                  {isCurrentUserPayer ? "You are" : `${payer?.displayName} is`} owed
                </span>
                <span className="font-semibold text-green-600">
                  {formatMoney(
                    expense.amountCents -
                      (expense.splits.find(
                        (s) => s.clerkUserId === expense.payerClerkUserId
                      )?.shareCents ?? 0)
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
