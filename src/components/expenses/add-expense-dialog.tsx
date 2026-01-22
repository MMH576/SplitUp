"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { dollarsToCents, centsToDollars } from "@/lib/utils/money";

type Member = {
  id: string;
  clerkUserId: string;
  displayName: string;
};

type SplitType = "EQUAL" | "CUSTOM";

type CustomSplitEntry = {
  clerkUserId: string;
  amount: string; // Keep as string for input handling
};

type AddExpenseDialogProps = {
  groupId: string;
  members: Member[];
  currentUserId: string;
};

export function AddExpenseDialog({
  groupId,
  members,
  currentUserId,
}: AddExpenseDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState(currentUserId);
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Split type state
  const [splitType, setSplitType] = useState<SplitType>("EQUAL");

  // Equal split state
  const [participantIds, setParticipantIds] = useState<string[]>(
    members.map((m) => m.clerkUserId)
  );

  // Custom split state
  const [customSplits, setCustomSplits] = useState<CustomSplitEntry[]>(
    members.map((m) => ({ clerkUserId: m.clerkUserId, amount: "" }))
  );

  // Validation state
  const [errors, setErrors] = useState<{
    title?: string;
    amount?: string;
    participants?: string;
    customSplits?: string;
  }>({});

  const handleParticipantToggle = (clerkUserId: string, checked: boolean) => {
    if (checked) {
      setParticipantIds((prev) => [...prev, clerkUserId]);
      setErrors((prev) => ({ ...prev, participants: undefined }));
    } else {
      setParticipantIds((prev) => prev.filter((id) => id !== clerkUserId));
    }
  };

  const selectAllParticipants = () => {
    setParticipantIds(members.map((m) => m.clerkUserId));
    setErrors((prev) => ({ ...prev, participants: undefined }));
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
    setErrors((prev) => ({ ...prev, customSplits: undefined }));
  };

  const clearCustomSplits = () => {
    setCustomSplits(
      members.map((m) => ({ clerkUserId: m.clerkUserId, amount: "" }))
    );
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = "Description is required";
    }

    if (splitType === "EQUAL") {
      // For equal splits, user must enter a total amount
      const amountCents = dollarsToCents(parseFloat(amount));
      if (isNaN(amountCents) || amountCents <= 0) {
        newErrors.amount = "Enter a valid amount greater than $0";
      }
      if (participantIds.length === 0) {
        newErrors.participants = "Select at least one participant";
      }
    } else {
      // For custom splits, total is auto-calculated from individual amounts
      const nonEmptySplits = customSplits.filter(
        (s) => s.amount && parseFloat(s.amount) > 0
      );
      if (nonEmptySplits.length === 0) {
        newErrors.customSplits = "Enter amounts for at least one person";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
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
        // Custom split - only include non-zero amounts, total is auto-calculated
        const nonEmptySplits = customSplits
          .filter((s) => s.amount && parseFloat(s.amount) > 0)
          .map((s) => ({
            clerkUserId: s.clerkUserId,
            shareCents: dollarsToCents(parseFloat(s.amount)),
          }));

        // Calculate total from individual splits
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

      const response = await fetch(`/api/groups/${groupId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add expense");
      }

      toast.success("Expense added!");
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add expense"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setPayerId(currentUserId);
    setParticipantIds(members.map((m) => m.clerkUserId));
    setCustomSplits(
      members.map((m) => ({ clerkUserId: m.clerkUserId, amount: "" }))
    );
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setSplitType("EQUAL");
    setErrors({});
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Add Expense</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add an expense</DialogTitle>
            <DialogDescription>
              Record who paid and how to split the cost.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">Description</Label>
              <Input
                id="title"
                placeholder="e.g., Dinner, Groceries, Uber"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, title: undefined }));
                  }
                }}
                disabled={isLoading}
                autoFocus
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Amount - only shown for EQUAL splits */}
            {splitType === "EQUAL" && (
              <div className="grid gap-2">
                <Label htmlFor="amount">Total Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    const cents = dollarsToCents(parseFloat(e.target.value));
                    if (!isNaN(cents) && cents > 0) {
                      setErrors((prev) => ({ ...prev, amount: undefined }));
                    }
                  }}
                  disabled={isLoading}
                  className={errors.amount ? "border-destructive" : ""}
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount}</p>
                )}
              </div>
            )}

            {/* Date */}
            <div className="grid gap-2">
              <Label htmlFor="expense-date">Date</Label>
              <Input
                id="expense-date"
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
                <div
                  className={`border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto ${
                    errors.participants ? "border-destructive" : ""
                  }`}
                >
                  {members.map((member) => (
                    <div
                      key={member.clerkUserId}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`participant-${member.clerkUserId}`}
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
                        htmlFor={`participant-${member.clerkUserId}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {member.displayName}
                        {member.clerkUserId === currentUserId && " (you)"}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.participants && (
                  <p className="text-sm text-destructive">
                    {errors.participants}
                  </p>
                )}
                {participantIds.length > 0 && effectiveAmountCents > 0 && (
                  <div className="text-sm space-y-1 pt-2 border-t">
                    {(() => {
                      const remainder = effectiveAmountCents % participantIds.length;
                      const hasRemainder = remainder > 0;

                      return (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span>
                            ${(perPersonCents / 100).toFixed(2)} per person ×{" "}
                            {participantIds.length}{" "}
                            {participantIds.length === 1 ? "person" : "people"}
                          </span>
                          {hasRemainder && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[200px]">
                                  <p className="text-xs">
                                    This amount doesn&apos;t split evenly. The extra{" "}
                                    {remainder}¢ will be distributed to{" "}
                                    {remainder === 1 ? "1 person" : `${remainder} people`}.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      );
                    })()}
                    {(() => {
                      const payerInSplit = participantIds.includes(payerId);
                      const othersCount = payerInSplit
                        ? participantIds.length - 1
                        : participantIds.length;
                      const payerName =
                        members.find((m) => m.clerkUserId === payerId)
                          ?.displayName || "Payer";

                      if (othersCount === 0) {
                        return (
                          <p className="text-xs text-muted-foreground">
                            {payerName} paid for themselves - no one owes
                            anything
                          </p>
                        );
                      }

                      const owedAmount = perPersonCents * othersCount;
                      return (
                        <p className="text-xs font-medium text-primary">
                          {othersCount} {othersCount === 1 ? "person owes" : "people owe"}{" "}
                          {payerName} ${(owedAmount / 100).toFixed(2)} total
                        </p>
                      );
                    })()}
                  </div>
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
                <div
                  className={`border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto ${
                    errors.customSplits ? "border-destructive" : ""
                  }`}
                >
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
                          <span className="text-sm text-muted-foreground">$</span>
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
                {errors.customSplits && (
                  <p className="text-sm text-destructive">
                    {errors.customSplits}
                  </p>
                )}
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
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
