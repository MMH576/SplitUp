import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GroupTabs, TabsContent, TabsList, TabsTrigger } from "@/components/groups/group-tabs";
import { InviteDialog } from "@/components/groups/invite-dialog";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { ExpenseList } from "@/components/expenses/expense-list";
import { formatMoney } from "@/lib/utils/money";
import { calculateGroupBalances } from "@/lib/utils/balances";
import { calculateSettlements } from "@/lib/utils/settlements";
import { SettlementPlan } from "@/components/settlements/settlement-plan";
import { GroupSettings } from "@/components/groups/group-settings";
import { FriendSettings } from "@/components/groups/friend-settings";

type PageProps = {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const validTabs = ["expenses", "balances", "settle", "settings"] as const;
type TabValue = (typeof validTabs)[number];

export default async function GroupPage({ params, searchParams }: PageProps) {
  const { groupId } = await params;
  const { tab } = await searchParams;
  const activeTab: TabValue = validTabs.includes(tab as TabValue)
    ? (tab as TabValue)
    : "expenses";
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Verify membership and get group data
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_clerkUserId: {
        groupId,
        clerkUserId: userId,
      },
    },
    include: {
      group: {
        include: {
          members: {
            orderBy: { joinedAt: "asc" },
          },
          expenses: {
            orderBy: { createdAt: "desc" },
            include: {
              splits: true,
            },
          },
          _count: {
            select: { expenses: true },
          },
        },
      },
    },
  });

  if (!membership) {
    notFound();
  }

  const { group } = membership;
  const isAdmin = membership.role === "ADMIN";

  // Detect if this is a friend group by type
  const isFriendGroup = group.type === "FRIEND";
  const friendMember = isFriendGroup
    ? group.members.find((m) => m.clerkUserId !== userId)
    : null;
  const displayTitle = isFriendGroup
    ? (friendMember?.displayNameSnapshot || group.name)
    : group.name;

  // Prepare members data for the AddExpenseDialog
  const membersForDialog = group.members.map((m) => ({
    id: m.id,
    clerkUserId: m.clerkUserId,
    displayName: m.displayNameSnapshot,
  }));

  // Calculate balances for the Balances tab
  const balances = await calculateGroupBalances(groupId);

  // Calculate settlement plan for the Settle Up tab
  const transfers = calculateSettlements(balances);

  // Fetch settlement records (payments that have been marked as done)
  const settlementRecords = await prisma.settlement.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
  });

  // Map settlement records with display names
  const memberMap = new Map(
    group.members.map((m) => [m.clerkUserId, m.displayNameSnapshot])
  );

  const settlementsWithNames = settlementRecords.map((s) => ({
    id: s.id,
    fromClerkUserId: s.fromClerkUserId,
    toClerkUserId: s.toClerkUserId,
    amountCents: s.amountCents,
    status: s.status,
    settledAt: s.settledAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    fromDisplayName: memberMap.get(s.fromClerkUserId) ?? "Unknown",
    toDisplayName: memberMap.get(s.toClerkUserId) ?? "Unknown",
  }));

  // Prepare expense breakdown for the current user's summary
  const expenseBreakdown = group.expenses.map((expense) => {
    const payer = group.members.find(
      (m) => m.clerkUserId === expense.payerClerkUserId
    );
    const userSplit = expense.splits.find((s) => s.clerkUserId === userId);

    return {
      title: expense.title,
      amountCents: expense.amountCents,
      payerName: payer?.displayNameSnapshot ?? "Unknown",
      payerClerkUserId: expense.payerClerkUserId,
      yourShareCents: userSplit?.shareCents ?? 0,
      date: expense.expenseDate,
    };
  });

  return (
    <div className="container py-6 sm:py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
            <Link href="/groups" className="hover:underline">
              {isFriendGroup ? "Friends" : "Groups"}
            </Link>
            <span>/</span>
            <span className="truncate max-w-[150px] sm:max-w-none">{displayTitle}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">{displayTitle}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isFriendGroup ? (
              <>{group._count.expenses} {group._count.expenses === 1 ? "expense" : "expenses"} shared</>
            ) : (
              <>{group.members.length} {group.members.length === 1 ? "member" : "members"} · {group._count.expenses} {group._count.expenses === 1 ? "expense" : "expenses"}</>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && !isFriendGroup && <InviteDialog groupId={groupId} />}
          <AddExpenseDialog
            groupId={groupId}
            members={membersForDialog}
            currentUserId={userId}
          />
        </div>
      </div>

      {/* Tabs */}
      <GroupTabs defaultValue={activeTab} groupId={groupId}>
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
          <TabsTrigger value="expenses" className="text-xs sm:text-sm">Expenses</TabsTrigger>
          <TabsTrigger value="balances" className="text-xs sm:text-sm">Balances</TabsTrigger>
          <TabsTrigger value="settle" className="text-xs sm:text-sm">Settle</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
        </TabsList>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          {group.expenses.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader className="text-center">
                <CardTitle>No expenses yet</CardTitle>
                <CardDescription>
                  Add your first expense to start tracking who owes whom.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <AddExpenseDialog
                  groupId={groupId}
                  members={membersForDialog}
                  currentUserId={userId}
                />
              </CardContent>
            </Card>
          ) : (
            <ExpenseList
              expenses={group.expenses.map((expense) => ({
                id: expense.id,
                title: expense.title,
                amountCents: expense.amountCents,
                payerClerkUserId: expense.payerClerkUserId,
                expenseDate: expense.expenseDate,
                splitType: expense.splitType,
                splits: expense.splits.map((s) => ({
                  clerkUserId: s.clerkUserId,
                  shareCents: s.shareCents,
                })),
              }))}
              groupId={groupId}
              members={membersForDialog}
              currentUserId={userId}
              settlements={settlementRecords
                .filter((s) => s.status === "COMPLETED")
                .map((s) => ({
                  fromClerkUserId: s.fromClerkUserId,
                  toClerkUserId: s.toClerkUserId,
                  amountCents: s.amountCents,
                }))}
            />
          )}
        </TabsContent>

        {/* Balances Tab */}
        <TabsContent value="balances" className="space-y-4">
          {group.expenses.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader className="text-center">
                <CardTitle>No expenses yet</CardTitle>
                <CardDescription>
                  Add expenses to see who owes whom.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle>{isFriendGroup ? "Balance" : "Group Balances"}</CardTitle>
                  <CardDescription>
                    {isFriendGroup
                      ? "Your balance with this friend."
                      : "Positive balance = others owe you. Negative = you owe others."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {balances.map((balance) => {
                      const isCurrentUser = balance.clerkUserId === userId;
                      const isPositive = balance.netCents > 0;
                      const isZero = balance.netCents === 0;

                      return (
                        <div
                          key={balance.clerkUserId}
                          className="flex items-center justify-between py-3 border-b last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {balance.displayName}
                              {isCurrentUser && (
                                <span className="text-muted-foreground font-normal"> (you)</span>
                              )}
                            </span>
                          </div>
                          <div className="text-right">
                            {isZero ? (
                              <span className="text-muted-foreground">Settled up</span>
                            ) : isPositive ? (
                              <div>
                                <span className="text-green-600 font-semibold">
                                  +{formatMoney(balance.netCents)}
                                </span>
                                <p className="text-xs text-muted-foreground">
                                  is owed
                                </p>
                              </div>
                            ) : (
                              <div>
                                <span className="text-red-600 font-semibold">
                                  {formatMoney(balance.netCents)}
                                </span>
                                <p className="text-xs text-muted-foreground">
                                  owes
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* All Settled Message */}
              {balances.every((b) => b.netCents === 0) && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="text-center">
                    <CardTitle className="text-green-700">All settled up!</CardTitle>
                    <CardDescription>
                      {isFriendGroup
                        ? "You're square with each other. No payments needed."
                        : "Everyone in this group is square. No payments needed."}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Settle Up Tab */}
        <TabsContent value="settle" className="space-y-4">
          {group.expenses.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader className="text-center">
                <CardTitle>No expenses yet</CardTitle>
                <CardDescription>
                  Add expenses to see settlement options.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <SettlementPlan
              transfers={transfers}
              currentUserId={userId}
              expenseBreakdown={expenseBreakdown}
              groupId={groupId}
              settlements={settlementsWithNames}
            />
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          {isFriendGroup ? (
            <FriendSettings
              groupId={groupId}
              friendName={displayTitle}
            />
          ) : (
            <GroupSettings
              groupId={groupId}
              groupName={group.name}
              members={group.members.map((m) => ({
                id: m.id,
                clerkUserId: m.clerkUserId,
                displayName: m.displayNameSnapshot,
                role: m.role,
                joinedAt: m.joinedAt,
              }))}
              currentUserId={userId}
              isAdmin={isAdmin}
            />
          )}
        </TabsContent>
      </GroupTabs>
    </div>
  );
}
