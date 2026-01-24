"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExpenseCard } from "./expense-card";

type Split = {
  clerkUserId: string;
  shareCents: number;
};

type SplitType = "EQUAL" | "CUSTOM";

type Expense = {
  id: string;
  title: string;
  amountCents: number;
  payerClerkUserId: string;
  expenseDate: Date;
  splitType?: SplitType;
  splits: Split[];
};

type Member = {
  id: string;
  clerkUserId: string;
  displayName: string;
};

type SettlementRecord = {
  fromClerkUserId: string;
  toClerkUserId: string;
  amountCents: number;
};

type ExpenseListProps = {
  expenses: Expense[];
  groupId: string;
  members: Member[];
  currentUserId: string;
  settlements?: SettlementRecord[];
};

export function ExpenseList({
  expenses,
  groupId,
  members,
  currentUserId,
  settlements = [],
}: ExpenseListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [payerFilter, setPayerFilter] = useState<string>("all");

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        expense.title.toLowerCase().includes(searchQuery.toLowerCase());

      // Payer filter
      const matchesPayer =
        payerFilter === "all" || expense.payerClerkUserId === payerFilter;

      return matchesSearch && matchesPayer;
    });
  }, [expenses, searchQuery, payerFilter]);

  const hasFilters = searchQuery !== "" || payerFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setPayerFilter("all");
  };

  return (
    <div className="space-y-3">
      {/* Filter bar - only show if there are expenses */}
      {expenses.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={payerFilter} onValueChange={setPayerFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by payer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payers</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.clerkUserId} value={member.clerkUserId}>
                  {member.displayName}
                  {member.clerkUserId === currentUserId && " (you)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="shrink-0"
              title="Clear filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Results */}
      {filteredExpenses.length === 0 && hasFilters ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No expenses match your filters.</p>
          <Button variant="link" onClick={clearFilters} className="mt-2">
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              groupId={groupId}
              members={members}
              currentUserId={currentUserId}
              settlements={settlements}
            />
          ))}
        </div>
      )}

      {/* Result count when filtering */}
      {hasFilters && filteredExpenses.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredExpenses.length} of {expenses.length} expenses
        </p>
      )}
    </div>
  );
}
