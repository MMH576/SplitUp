import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InviteDialog } from "@/components/groups/invite-dialog";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupPage({ params }: PageProps) {
  const { groupId } = await params;
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
            take: 5,
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

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/groups" className="hover:underline">
              My Groups
            </Link>
            <span>/</span>
            <span>{group.name}</span>
          </div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <p className="text-muted-foreground">
            {group.members.length} {group.members.length === 1 ? "member" : "members"} · {group._count.expenses} {group._count.expenses === 1 ? "expense" : "expenses"}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <InviteDialog groupId={groupId} />}
          <Button>Add Expense</Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="settle">Settle Up</TabsTrigger>
          {isAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
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
                <Button>Add Expense</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {group.expenses.map((expense) => {
                const payer = group.members.find(
                  (m) => m.clerkUserId === expense.payerClerkUserId
                );
                return (
                  <Card key={expense.id}>
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{expense.title}</CardTitle>
                          <CardDescription>
                            Paid by {payer?.displayNameSnapshot ?? "Unknown"} · {expense.splits.length} {expense.splits.length === 1 ? "person" : "people"}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            ${(expense.amountCents / 100).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(expense.expenseDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
              {group._count.expenses > 5 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  Showing 5 of {group._count.expenses} expenses
                </p>
              )}
            </div>
          )}
        </TabsContent>

        {/* Balances Tab */}
        <TabsContent value="balances" className="space-y-4">
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <CardTitle>Balances</CardTitle>
              <CardDescription>
                Balance calculations will be implemented in Phase 6.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        {/* Settle Up Tab */}
        <TabsContent value="settle" className="space-y-4">
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <CardTitle>Settle Up</CardTitle>
              <CardDescription>
                Settlement plan will be implemented in Phase 7.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        {/* Settings Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Group Members</CardTitle>
                <CardDescription>
                  People who are part of this group
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <div className="font-medium">{member.displayNameSnapshot}</div>
                        <div className="text-sm text-muted-foreground">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                      {member.role === "ADMIN" && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
