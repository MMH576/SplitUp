"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { dollarsToCents, centsToDollars } from "@/lib/utils/money";

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

type CustomSplitEntry = {
  clerkUserId: string;
  amount: string;
};

type EditExpenseDialogProps = {
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
  groupId: string;
  members: Member[];
  currentUserId: string;
};

export function EditExpenseDialog({
  open,
  onOpenChange,
  expense,
  groupId,
  members,
  currentUserId,
}: EditExpenseDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState(expense.title);
  const [amount, setAmount] = useState(
    centsToDollars(expense.amountCents).toString()
  );
  const [payerId, setPayerId] = useState(expense.payerClerkUserId);
  const [expenseDate, setExpenseDate] = useState(
    new Date(expense.expenseDate).toISOString().split("T")[0]
  );

  // Determine initial split type from expense data
  const getInitialSplitType = (): SplitType => {
    if (expense.splitType) return expense.splitType;
    // Legacy expenses without splitType - check if splits are equal
    if (expense.splits.length === 0) return "EQUAL";
    const perPerson = Math.floor(
      expense.amountCents / expense.splits.length
    );
    const isEqual = expense.splits.every(
      (s) => Math.abs(s.shareCents - perPerson) <= 1
    );
    return isEqual ? "EQUAL" : "CUSTOM";
  };

  const [splitType, setSplitType] = useState<SplitType>(getInitialSplitType());

  // Equal split state
  const [participantIds, setParticipantIds] = useState<string[]>(
    expense.splits.map((s) => s.clerkUserId)
  );

  // Custom split state
  const [customSplits, setCustomSplits] = useState<CustomSplitEntry[]>(
    members.map((m) => {
      const existingSplit = expense.splits.find(
        (s) => s.clerkUserId === m.clerkUserId
      );
      return {
        clerkUserId: m.clerkUserId,
        amount: existingSplit
          ? centsToDollars(existingSplit.shareCents).toFixed(2)
          : "",
      };
    })
  );

  // Reset form when expense changes or dialog opens
  useEffect(() => {
    if (open) {
      setTitle(expense.title);
      setAmount(centsToDollars(expense.amountCents).toString());
      setPayerId(expense.payerClerkUserId);
      setExpenseDate(
        new Date(expense.expenseDate).toISOString().split("T")[0]
      );
      setSplitType(getInitialSplitType());
      setParticipantIds(expense.splits.map((s) => s.clerkUserId));
      setCustomSplits(
        members.map((m) => {
          const existingSplit = expense.splits.find(
            (s) => s.clerkUserId === m.clerkUserId
          );
          return {
            clerkUserId: m.clerkUserId,
            amount: existingSplit
              ? centsToDollars(existingSplit.shareCents).toFixed(2)
              : "",
          };
        })
      );
    }
  }, [open, expense, members]);

  const handleParticipantToggle = (clerkUserId: string, checked: boolean) => {
    if (checked) {
      setParticipantIds((prev) => [...prev, clerkUserId]);
    } else {
      setParticipantIds((prev) => prev.filter((id) => id !== clerkUserId));
    }
  };

  const selectAllParticipants = () => {
    setParticipantIds(members.map((m) => m.clerkUserId));
  };

  const clearAllParticipants = () => {
    setParticipantIds([]);
  };

  const handleCustomSplitChange = (clerkUserId: string, value: string) => {
    setCustomSplits((prev) =>
      prev.map((s) =>
        s.clerkUserId === clerkUserId ? { ...s, amount: value } : s
      )
    );
  };

  const clearCustomSplits = () => {
    setCustomSplits(
      members.map((m) => ({ clerkUserId: m.clerkUserId, amount: "" }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (splitType === "EQUAL") {
      const amountCents = dollarsToCents(parseFloat(amount));
      if (isNaN(amountCents) || amountCents <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
      if (participantIds.length === 0) {
        toast.error("Please select at least one participant");
        return;
      }
    }

    if (splitType === "CUSTOM") {
      const nonEmptySplits = customSplits.filter(
        (s) => s.amount && parseFloat(s.amount) > 0
      );
      if (nonEmptySplits.length === 0) {
        toast.error("Enter amounts for at least one person");
        return;
      }
    }

    setIsLoading(true);

    try {
      let body;

      if (splitType === "EQUAL") {
        const amountCents = dollarsToCents(parseFloat(amount));
        body = {
          title: title.trim(),
          amountCents,
          payerClerkUserId: payerId,
          splitType: "EQUAL",
          participantIds,
          expenseDate: new Date(expenseDate).toISOString(),
        };
      } else {
        // Custom split - total is auto-calculated from individual amounts
        const nonEmptySplits = customSplits
          .filter((s) => s.amount && parseFloat(s.amount) > 0)
          .map((s) => ({
            clerkUserId: s.clerkUserId,
            shareCents: dollarsToCents(parseFloat(s.amount)),
          }));

        const calculatedTotal = nonEmptySplits.reduce(
          (sum, s) => sum + s.shareCents,
          0
        );

        body = {
          title: title.trim(),
          amountCents: calculatedTotal,
          payerClerkUserId: payerId,
          splitType: "CUSTOM",
          customSplits: nonEmptySplits,
          expenseDate: new Date(expenseDate).toISOString(),
        };
      }

      const response = await fetch(
        `/api/groups/${groupId}/expenses/${expense.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update expense");
      }

      toast.success("Expense updated!");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update expense"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Custom split total - calculated from individual amounts
  const customSplitTotal = customSplits.reduce(
    (sum, s) => sum + dollarsToCents(parseFloat(s.amount) || 0),
    0
  );

  // For EQUAL: use entered amount; for CUSTOM: use sum of splits
  const effectiveAmountCents =
    splitType === "CUSTOM" ? customSplitTotal : dollarsToCents(parseFloat(amount) || 0);

  const perPersonCents =
    participantIds.length > 0
      ? Math.floor(effectiveAmountCents / participantIds.length)
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit expense</DialogTitle>
            <DialogDescription>
              Update the expense details. Changes will recalculate all balances.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Description</Label>
              <Input
                id="edit-title"
                placeholder="e.g., Dinner, Groceries, Uber"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>

            {/* Amount - only shown for EQUAL splits */}
            {splitType === "EQUAL" && (
              <div className="grid gap-2">
                <Label htmlFor="edit-amount">Total Amount ($)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Date */}
            <div className="grid gap-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Paid by */}
            <div className="grid gap-2">
              <Label>Paid by</Label>
              <Select value={payerId} onValueChange={setPayerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select who paid" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem
                      key={member.clerkUserId}
                      value={member.clerkUserId}
                    >
                      {member.displayName}
                      {member.clerkUserId === currentUserId && " (you)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Split Type Toggle */}
            <div className="grid gap-2">
              <Label>How to split?</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={splitType === "EQUAL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSplitType("EQUAL")}
                  className="flex-1"
                >
                  Split Equally
                </Button>
                <Button
                  type="button"
                  variant={splitType === "CUSTOM" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSplitType("CUSTOM")}
                  className="flex-1"
                >
                  Custom Amounts
                </Button>
              </div>
            </div>

            {/* Equal Split UI */}
            {splitType === "EQUAL" && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Who benefited from this?</Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={selectAllParticipants}
                      className="h-auto py-1 px-2 text-xs"
                    >
                      Select all
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearAllParticipants}
                      className="h-auto py-1 px-2 text-xs text-muted-foreground"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {members.map((member) => (
                    <div
                      key={member.clerkUserId}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`edit-participant-${member.clerkUserId}`}
                        checked={participantIds.includes(member.clerkUserId)}
                        onCheckedChange={(checked) =>
                          handleParticipantToggle(
                            member.clerkUserId,
                            checked === true
                          )
                        }
                        disabled={isLoading}
                      />
                      <label
                        htmlFor={`edit-participant-${member.clerkUserId}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {member.displayName}
                        {member.clerkUserId === currentUserId && " (you)"}
                      </label>
                    </div>
                  ))}
                </div>
                {participantIds.length > 0 && effectiveAmountCents > 0 && (
                  <p className="text-sm text-muted-foreground pt-1">
                    ${(perPersonCents / 100).toFixed(2)} per person ×{" "}
                    {participantIds.length}{" "}
                    {participantIds.length === 1 ? "person" : "people"}
                  </p>
                )}
                {participantIds.length === 0 && (
                  <p className="text-sm text-destructive">
                    Select at least one participant
                  </p>
                )}
              </div>
            )}

            {/* Custom Split UI */}
            {splitType === "CUSTOM" && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Enter each person&apos;s share</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearCustomSplits}
                    className="h-auto py-1 px-2 text-xs text-muted-foreground"
                  >
                    Clear
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground -mt-1">
                  Enter what each person owes. Total will be calculated automatically.
                </p>
                <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                  {members.map((member) => {
                    const split = customSplits.find(
                      (s) => s.clerkUserId === member.clerkUserId
                    );
                    return (
                      <div
                        key={member.clerkUserId}
                        className="flex items-center gap-2"
                      >
                        <span className="text-sm flex-1 min-w-0 truncate">
                          {member.displayName}
                          {member.clerkUserId === currentUserId && " (you)"}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={split?.amount || ""}
                            onChange={(e) =>
                              handleCustomSplitChange(
                                member.clerkUserId,
                                e.target.value
                              )
                            }
                            disabled={isLoading}
                            className="w-24 h-8 text-right"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Show auto-calculated total */}
                <div className="text-sm pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total:</span>
                    <span className={`text-lg font-semibold ${customSplitTotal > 0 ? "text-primary" : "text-muted-foreground"}`}>
                      ${centsToDollars(customSplitTotal).toFixed(2)}
                    </span>
                  </div>
                  {customSplitTotal > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {customSplits.filter((s) => s.amount && parseFloat(s.amount) > 0).length} of {members.length} people included
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
