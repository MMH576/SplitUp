"use client";

import { useState } from "react";
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
};

export function SettlementPlan({ transfers, currentUserId, expenseBreakdown = [] }: SettlementPlanProps) {
  const [copying, setCopying] = useState(false);

  const handleCopySummary = async () => {
    if (transfers.length === 0) return;

    // Build full summary with expense breakdown
    const lines: string[] = [];

    // Expense breakdown section
    if (expenseBreakdown.length > 0) {
      lines.push("EXPENSES:");
      expenseBreakdown.forEach((expense) => {
        const amount = formatMoney(expense.amountCents);
        lines.push(`  ${expense.title} - ${expense.payerName} paid ${amount}`);
      });
      lines.push("");
    }

    // Settlement plan section
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

  // No transfers needed - everyone is settled
  if (transfers.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <CardTitle className="text-green-700">All settled up!</CardTitle>
          <CardDescription>
            Everyone in this group is square. No payments needed.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
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

              return (
                <div
                  key={`${transfer.fromClerkUserId}-${transfer.toClerkUserId}-${index}`}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
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
                  <div className="text-right">
                    <span className={`text-lg font-semibold ${
                      isCurrentUserPaying
                        ? "text-red-600"
                        : isCurrentUserReceiving
                        ? "text-green-600"
                        : ""
                    }`}>
                      {formatMoney(transfer.amountCents)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary for current user */}
      {(() => {
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

        // Calculate what you owe vs what you paid
        const expensesYouPaid = expenseBreakdown.filter(
          (e) => e.payerClerkUserId === currentUserId
        );
        const expensesOthersPaid = expenseBreakdown.filter(
          (e) => e.payerClerkUserId !== currentUserId && e.yourShareCents > 0
        );

        const totalYouPaid = expensesYouPaid.reduce((sum, e) => sum + e.amountCents, 0);
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
                  <span className={`font-semibold ${totalYouPaid >= totalYourShare ? "text-green-600" : "text-red-600"}`}>
                    {formatMoney(Math.abs(totalYouPaid - totalYourShare))}
                  </span>
                </div>
              </div>

              {/* Expense breakdown */}
              {expenseBreakdown.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">EXPENSE BREAKDOWN</p>
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
                              {youPaid ? "You paid" : `${expense.payerName} paid`} {formatMoney(expense.amountCents)}
                              {" · "}
                              {new Date(expense.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Your share</p>
                            <p className={`font-medium ${youPaid && expense.yourShareCents < expense.amountCents ? "text-green-600" : ""}`}>
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
      })()}
    </div>
  );
}
