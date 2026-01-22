"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils/money";
import { toast } from "sonner";

type Transfer = {
  fromClerkUserId: string;
  fromDisplayName: string;
  toClerkUserId: string;
  toDisplayName: string;
  amountCents: number;
};

type Settlement = {
  id: string;
  fromClerkUserId: string;
  toClerkUserId: string;
  amountCents: number;
  status: "PENDING" | "COMPLETED";
  settledAt: string | null;
  createdAt: string;
  fromDisplayName: string;
  toDisplayName: string;
};

type ExpenseBreakdown = {
  title: string;
  amountCents: number;
  payerName: string;
  payerClerkUserId: string;
  yourShareCents: number;
  date: Date;
};

type SettlementPlanProps = {
  transfers: Transfer[];
  currentUserId: string;
  expenseBreakdown?: ExpenseBreakdown[];
  groupId: string;
  settlements?: Settlement[];
};

export function SettlementPlan({
  transfers,
  currentUserId,
  expenseBreakdown = [],
  groupId,
  settlements = [],
}: SettlementPlanProps) {
  const router = useRouter();
  const [copying, setCopying] = useState(false);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  const handleCopySummary = async () => {
    if (transfers.length === 0) return;

    const lines: string[] = [];

    if (expenseBreakdown.length > 0) {
      lines.push("EXPENSES:");
      expenseBreakdown.forEach((expense) => {
        const amount = formatMoney(expense.amountCents);
        lines.push(`  ${expense.title} - ${expense.payerName} paid ${amount}`);
      });
      lines.push("");
    }

    lines.push("SETTLEMENT PLAN:");
    transfers.forEach((t) => {
      const amount = formatMoney(t.amountCents);
      lines.push(`  ${t.fromDisplayName} pays ${t.toDisplayName} ${amount}`);
    });

    const summary = lines.join("\n");

    try {
      setCopying(true);
      await navigator.clipboard.writeText(summary);
      toast.success("Summary copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    } finally {
      setCopying(false);
    }
  };

  const handleMarkAsPaid = async (transfer: Transfer) => {
    const transferKey = `${transfer.fromClerkUserId}-${transfer.toClerkUserId}`;
    setMarkingPaid(transferKey);

    try {
      const response = await fetch(`/api/groups/${groupId}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromClerkUserId: transfer.fromClerkUserId,
          toClerkUserId: transfer.toClerkUserId,
          amountCents: transfer.amountCents,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to record payment");
      }

      // Now mark it as completed
      const createResult = await response.json();
      const settlementId = createResult.data.id;

      const completeResponse = await fetch(
        `/api/groups/${groupId}/settlements/${settlementId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "COMPLETED" }),
        }
      );

      if (!completeResponse.ok) {
        throw new Error("Failed to mark as completed");
      }

      toast.success("Payment recorded!");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to record payment"
      );
    } finally {
      setMarkingPaid(null);
    }
  };

  const handleUndoSettlement = async (settlementId: string) => {
    try {
      const response = await fetch(
        `/api/groups/${groupId}/settlements/${settlementId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to undo payment");
      }

      toast.success("Payment record removed");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to undo payment"
      );
    }
  };

  // Filter completed settlements
  const completedSettlements = settlements.filter((s) => s.status === "COMPLETED");

  // No transfers needed - everyone is settled
  if (transfers.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <CardTitle className="text-green-700">All settled up!</CardTitle>
            <CardDescription>
              Everyone in this group is square. No payments needed.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Show settlement history even when all settled */}
        {completedSettlements.length > 0 && (
          <SettlementHistory
            settlements={completedSettlements}
            currentUserId={currentUserId}
            onUndo={handleUndoSettlement}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>Settlement Plan</CardTitle>
              <CardDescription>
                {transfers.length} {transfers.length === 1 ? "payment" : "payments"} to settle all debts
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySummary}
              disabled={copying}
            >
              {copying ? "Copying..." : "Copy Summary"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transfers.map((transfer, index) => {
              const isCurrentUserPaying = transfer.fromClerkUserId === currentUserId;
              const isCurrentUserReceiving = transfer.toClerkUserId === currentUserId;
              const isInvolved = isCurrentUserPaying || isCurrentUserReceiving;
              const transferKey = `${transfer.fromClerkUserId}-${transfer.toClerkUserId}`;
              const isMarking = markingPaid === transferKey;

              return (
                <div
                  key={`${transfer.fromClerkUserId}-${transfer.toClerkUserId}-${index}`}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-3 ${
                    isCurrentUserPaying
                      ? "bg-red-50 border-red-200"
                      : isCurrentUserReceiving
                      ? "bg-green-50 border-green-200"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium">
                        {transfer.fromDisplayName}
                        {isCurrentUserPaying && (
                          <span className="text-muted-foreground font-normal"> (you)</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        pays {transfer.toDisplayName}
                        {isCurrentUserReceiving && " (you)"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-lg font-semibold ${
                        isCurrentUserPaying
                          ? "text-red-600"
                          : isCurrentUserReceiving
                          ? "text-green-600"
                          : ""
                      }`}
                    >
                      {formatMoney(transfer.amountCents)}
                    </span>
                    {isInvolved && (
                      <Button
                        size="sm"
                        variant={isCurrentUserPaying ? "default" : "outline"}
                        onClick={() => handleMarkAsPaid(transfer)}
                        disabled={isMarking}
                      >
                        {isMarking ? "Recording..." : "Mark Paid"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Settlement History */}
      {completedSettlements.length > 0 && (
        <SettlementHistory
          settlements={completedSettlements}
          currentUserId={currentUserId}
          onUndo={handleUndoSettlement}
        />
      )}

      {/* Summary for current user */}
      <UserSummary
        transfers={transfers}
        currentUserId={currentUserId}
        expenseBreakdown={expenseBreakdown}
      />
    </div>
  );
}

// Settlement History Component
function SettlementHistory({
  settlements,
  currentUserId,
  onUndo,
}: {
  settlements: Settlement[];
  currentUserId: string;
  onUndo: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment History</CardTitle>
        <CardDescription>
          Payments that have been marked as completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {settlements.map((settlement) => {
            const isCurrentUserPayer = settlement.fromClerkUserId === currentUserId;
            const isCurrentUserReceiver = settlement.toClerkUserId === currentUserId;
            const canUndo = isCurrentUserPayer || isCurrentUserReceiver;

            return (
              <div
                key={settlement.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b last:border-0 gap-2"
              >
                <div>
                  <p className="text-sm">
                    <span className="font-medium">
                      {settlement.fromDisplayName}
                      {isCurrentUserPayer && " (you)"}
                    </span>
                    {" paid "}
                    <span className="font-medium">
                      {settlement.toDisplayName}
                      {isCurrentUserReceiver && " (you)"}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {settlement.settledAt
                      ? new Date(settlement.settledAt).toLocaleDateString()
                      : new Date(settlement.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-green-600">
                    {formatMoney(settlement.amountCents)}
                  </span>
                  {canUndo && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7"
                      onClick={() => onUndo(settlement.id)}
                    >
                      Undo
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// User Summary Component
function UserSummary({
  transfers,
  currentUserId,
  expenseBreakdown,
}: {
  transfers: Transfer[];
  currentUserId: string;
  expenseBreakdown: ExpenseBreakdown[];
}) {
  const userPayments = transfers.filter((t) => t.fromClerkUserId === currentUserId);
  const userReceivables = transfers.filter((t) => t.toClerkUserId === currentUserId);

  const totalToPay = userPayments.reduce((sum, t) => sum + t.amountCents, 0);
  const totalToReceive = userReceivables.reduce((sum, t) => sum + t.amountCents, 0);

  if (totalToPay === 0 && totalToReceive === 0) {
    return (
      <Card>
        <CardHeader className="text-center py-4">
          <CardDescription>
            You&apos;re not involved in any payments. You&apos;re all square!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalYouPaid = expenseBreakdown
    .filter((e) => e.payerClerkUserId === currentUserId)
    .reduce((sum, e) => sum + e.amountCents, 0);
  const totalYourShare = expenseBreakdown.reduce((sum, e) => sum + e.yourShareCents, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your Summary</CardTitle>
        <CardDescription>
          Here&apos;s why you {totalToPay > 0 ? "owe" : "are owed"} money
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance explanation */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total you paid for the group:</span>
            <span className="font-medium">{formatMoney(totalYouPaid)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Your fair share of all expenses:</span>
            <span className="font-medium">{formatMoney(totalYourShare)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-medium">
              {totalYouPaid >= totalYourShare ? "Others owe you:" : "You owe others:"}
            </span>
            <span
              className={`font-semibold ${
                totalYouPaid >= totalYourShare ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatMoney(Math.abs(totalYouPaid - totalYourShare))}
            </span>
          </div>
        </div>

        {/* Expense breakdown */}
        {expenseBreakdown.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              EXPENSE BREAKDOWN
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {expenseBreakdown.map((expense, index) => {
                const youPaid = expense.payerClerkUserId === currentUserId;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{expense.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {youPaid ? "You paid" : `${expense.payerName} paid`}{" "}
                        {formatMoney(expense.amountCents)}
                        {" · "}
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Your share</p>
                      <p
                        className={`font-medium ${
                          youPaid && expense.yourShareCents < expense.amountCents
                            ? "text-green-600"
                            : ""
                        }`}
                      >
                        {formatMoney(expense.yourShareCents)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Final action */}
        <div className="pt-2 border-t">
          {totalToPay > 0 && (
            <div className="flex justify-between items-center">
              <span className="font-medium">You need to pay:</span>
              <span className="text-lg font-semibold text-red-600">
                {formatMoney(totalToPay)}
              </span>
            </div>
          )}
          {totalToReceive > 0 && (
            <div className="flex justify-between items-center">
              <span className="font-medium">You will receive:</span>
              <span className="text-lg font-semibold text-green-600">
                {formatMoney(totalToReceive)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
