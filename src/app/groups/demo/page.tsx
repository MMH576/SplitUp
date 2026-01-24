"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";

const DEMO_MEMBERS = [
  { id: "1", clerkUserId: "user_you", displayName: "You" },
  { id: "2", clerkUserId: "user_alex", displayName: "Alex Johnson" },
  { id: "3", clerkUserId: "user_sarah", displayName: "Sarah Kim" },
  { id: "4", clerkUserId: "user_mike", displayName: "Mike Chen" },
];

const DEMO_EXPENSES = [
  {
    id: "exp1",
    title: "Dinner at restaurant",
    amountCents: 12000,
    payerClerkUserId: "user_you",
    expenseDate: new Date("2026-01-20"),
    splits: [
      { clerkUserId: "user_you", shareCents: 3000 },
      { clerkUserId: "user_alex", shareCents: 3000 },
      { clerkUserId: "user_sarah", shareCents: 3000 },
      { clerkUserId: "user_mike", shareCents: 3000 },
    ],
  },
  {
    id: "exp2",
    title: "Uber to hotel",
    amountCents: 4500,
    payerClerkUserId: "user_alex",
    expenseDate: new Date("2026-01-19"),
    splits: [
      { clerkUserId: "user_you", shareCents: 1125 },
      { clerkUserId: "user_alex", shareCents: 1125 },
      { clerkUserId: "user_sarah", shareCents: 1125 },
      { clerkUserId: "user_mike", shareCents: 1125 },
    ],
  },
  {
    id: "exp3",
    title: "Museum tickets",
    amountCents: 8000,
    payerClerkUserId: "user_sarah",
    expenseDate: new Date("2026-01-18"),
    splits: [
      { clerkUserId: "user_you", shareCents: 2000 },
      { clerkUserId: "user_alex", shareCents: 2000 },
      { clerkUserId: "user_sarah", shareCents: 2000 },
      { clerkUserId: "user_mike", shareCents: 2000 },
    ],
  },
  {
    id: "exp4",
    title: "Groceries",
    amountCents: 6500,
    payerClerkUserId: "user_you",
    expenseDate: new Date("2026-01-17"),
    splits: [
      { clerkUserId: "user_you", shareCents: 1625 },
      { clerkUserId: "user_alex", shareCents: 1625 },
      { clerkUserId: "user_sarah", shareCents: 1625 },
      { clerkUserId: "user_mike", shareCents: 1625 },
    ],
  },
];

const DEMO_BALANCES = [
  { clerkUserId: "user_you", displayName: "You", netCents: 5250 },
  { clerkUserId: "user_alex", displayName: "Alex Johnson", netCents: -250 },
  { clerkUserId: "user_sarah", displayName: "Sarah Kim", netCents: -1875 },
  { clerkUserId: "user_mike", displayName: "Mike Chen", netCents: -3125 },
];

const DEMO_SETTLEMENTS = [
  { from: "Mike Chen", to: "You", amountCents: 3125 },
  { from: "Sarah Kim", to: "You", amountCents: 1875 },
  { from: "Alex Johnson", to: "You", amountCents: 250 },
];

function formatMoney(cents: number) {
  const abs = Math.abs(cents);
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(abs / 100).toFixed(2)}`;
}

function DemoGroupContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "group";
  const groupName = type === "friend" ? "Alex Johnson" : "Trip to Paris";
  const isFriend = type === "friend";

  const members = isFriend ? DEMO_MEMBERS.slice(0, 2) : DEMO_MEMBERS;
  const expenses = isFriend ? DEMO_EXPENSES.slice(0, 2) : DEMO_EXPENSES;
  const balances = isFriend
    ? [
        { clerkUserId: "user_you", displayName: "You", netCents: 5625 },
        { clerkUserId: "user_alex", displayName: "Alex Johnson", netCents: -5625 },
      ]
    : DEMO_BALANCES;
  const settlements = isFriend
    ? [{ from: "Alex Johnson", to: "You", amountCents: 5625 }]
    : DEMO_SETTLEMENTS;

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-[oklch(0.80_0.065_220/0.08)] blur-3xl" />
      <div className="absolute bottom-20 -right-32 w-80 h-80 rounded-full bg-[oklch(0.82_0.175_85/0.06)] blur-3xl" />

      <div className="relative mx-auto max-w-4xl py-6 sm:py-8 px-4 sm:px-6">
        {/* Demo banner */}
        <div className="mb-4 rounded-lg bg-[oklch(0.82_0.175_85/0.1)] border border-[oklch(0.82_0.175_85/0.3)] px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-medium text-[oklch(0.52_0.14_60)]">
            This is an interactive example. Your real data will look like this!
          </span>
          <Link href="/groups">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
              <span>{isFriend ? "Friends" : "Groups"}</span>
              <span>/</span>
              <span>{groupName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient">{groupName}</h1>
            <p className="text-sm text-muted-foreground">
              {isFriend
                ? `${expenses.length} expenses shared`
                : `${members.length} members · ${expenses.length} expenses`}
            </p>
          </div>
          <Button disabled className="opacity-60">Add Expense</Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="expenses" className="space-y-4">
          <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
            <TabsTrigger value="expenses" className="text-xs sm:text-sm">Expenses</TabsTrigger>
            <TabsTrigger value="balances" className="text-xs sm:text-sm">Balances</TabsTrigger>
            <TabsTrigger value="settle" className="text-xs sm:text-sm">Settle</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-2">
            {expenses.map((expense) => {
              const payer = members.find((m) => m.clerkUserId === expense.payerClerkUserId);
              const isYou = expense.payerClerkUserId === "user_you";
              const yourSplit = expense.splits.find((s) => s.clerkUserId === "user_you");
              const getBack = isYou ? expense.amountCents - (yourSplit?.shareCents ?? 0) : 0;

              return (
                <Card key={expense.id} className="hover:shadow-md transition-all">
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{expense.title}</CardTitle>
                        <CardDescription>
                          {isYou ? "You paid" : `Paid by ${payer?.displayName}`} · {expense.expenseDate.toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        {isYou ? (
                          <>
                            <div className="font-semibold text-green-600">{formatMoney(expense.amountCents)}</div>
                            <div className="text-xs text-muted-foreground">Get back {formatMoney(getBack)}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-semibold text-red-600">{formatMoney(yourSplit?.shareCents ?? 0)}</div>
                            <div className="text-xs text-muted-foreground">You owe {payer?.displayName}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </TabsContent>

          {/* Balances Tab */}
          <TabsContent value="balances" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isFriend ? "Balance" : "Group Balances"}</CardTitle>
                <CardDescription>
                  {isFriend
                    ? "Your balance with this friend."
                    : "Positive balance = others owe you. Negative = you owe others."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {balances.map((balance) => {
                    const isYou = balance.clerkUserId === "user_you";
                    const isPositive = balance.netCents > 0;
                    const isZero = balance.netCents === 0;

                    return (
                      <div key={balance.clerkUserId} className="flex items-center justify-between py-3 border-b last:border-0">
                        <span className="font-medium">
                          {balance.displayName}
                          {isYou && <span className="text-muted-foreground font-normal"> (you)</span>}
                        </span>
                        <div className="text-right">
                          {isZero ? (
                            <span className="text-muted-foreground">Settled up</span>
                          ) : isPositive ? (
                            <div>
                              <span className="text-green-600 font-semibold">+{formatMoney(balance.netCents)}</span>
                              <p className="text-xs text-muted-foreground">is owed</p>
                            </div>
                          ) : (
                            <div>
                              <span className="text-red-600 font-semibold">{formatMoney(balance.netCents)}</span>
                              <p className="text-xs text-muted-foreground">owes</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settle Tab */}
          <TabsContent value="settle" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Settlement Plan</CardTitle>
                <CardDescription>
                  Optimized payments to settle all debts with the fewest transactions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {settlements.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{s.from}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{s.to}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[oklch(0.72_0.18_55)]">{formatMoney(s.amountCents)}</span>
                        <Button size="sm" variant="outline" disabled className="opacity-60 text-xs">
                          Mark Paid
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isFriend ? "Friend Settings" : "Group Settings"}</CardTitle>
                <CardDescription>
                  {isFriend
                    ? "Manage your friendship connection."
                    : "Manage group members and settings."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isFriend && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium mb-2">Members</h4>
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm">{m.displayName}</span>
                        <span className="text-xs text-muted-foreground">
                          {m.clerkUserId === "user_you" ? "Admin" : "Member"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {isFriend && (
                  <p className="text-sm text-muted-foreground">
                    You can remove this friend from settings when using your real account.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function DemoGroupPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center"><span className="text-muted-foreground">Loading...</span></div>}>
      <DemoGroupContent />
    </Suspense>
  );
}
