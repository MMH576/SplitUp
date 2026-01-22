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
import { toast } from "sonner";
import { dollarsToCents } from "@/lib/utils/money";

type Member = {
  id: string;
  clerkUserId: string;
  displayName: string;
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
  const [participantIds, setParticipantIds] = useState<string[]>(
    members.map((m) => m.clerkUserId)
  );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    const amountCents = dollarsToCents(parseFloat(amount));
    if (isNaN(amountCents) || amountCents <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (participantIds.length === 0) {
      toast.error("Please select at least one participant");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          amountCents,
          payerClerkUserId: payerId,
          participantIds,
        }),
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
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  // Calculate per-person split for preview
  const amountCents = dollarsToCents(parseFloat(amount) || 0);
  const perPersonCents =
    participantIds.length > 0
      ? Math.floor(amountCents / participantIds.length)
      : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Add Expense</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add an expense</DialogTitle>
            <DialogDescription>
              Record who paid and who benefited from this expense.
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
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>

            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
                    <SelectItem key={member.clerkUserId} value={member.clerkUserId}>
                      {member.displayName}
                      {member.clerkUserId === currentUserId && " (you)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Split between */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Who benefited from this?</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAllParticipants}
                  className="h-auto py-1 px-2 text-xs"
                >
                  Select all
                </Button>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">
                Select everyone who should share this cost (including the payer if they also benefited)
              </p>
              <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.clerkUserId}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`participant-${member.clerkUserId}`}
                      checked={participantIds.includes(member.clerkUserId)}
                      onCheckedChange={(checked) =>
                        handleParticipantToggle(member.clerkUserId, checked === true)
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
              {participantIds.length > 0 && amountCents > 0 && (
                <div className="text-sm space-y-1 pt-2 border-t">
                  <p className="text-muted-foreground">
                    ${(perPersonCents / 100).toFixed(2)} per person × {participantIds.length}{" "}
                    {participantIds.length === 1 ? "person" : "people"}
                  </p>
                  {/* Show who owes the payer */}
                  {(() => {
                    const payerInSplit = participantIds.includes(payerId);
                    const othersCount = payerInSplit
                      ? participantIds.length - 1
                      : participantIds.length;
                    const payerName = members.find(m => m.clerkUserId === payerId)?.displayName || "Payer";

                    if (othersCount === 0) {
                      return (
                        <p className="text-xs text-muted-foreground">
                          {payerName} paid for themselves — no one owes anything
                        </p>
                      );
                    }

                    const owedAmount = perPersonCents * othersCount;
                    return (
                      <p className="text-xs font-medium text-primary">
                        → {othersCount} {othersCount === 1 ? "person owes" : "people owe"} {payerName} ${(owedAmount / 100).toFixed(2)} total
                      </p>
                    );
                  })()}
                </div>
              )}
            </div>
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
