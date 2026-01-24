import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { GroupCard } from "@/components/groups/group-card";
import { FriendCard } from "@/components/groups/friend-card";
import { JoinGroupDialog } from "@/components/groups/join-group-dialog";
import { AddFriendDialog } from "@/components/groups/add-friend-dialog";
import { UserPlus, Users, Receipt, TrendingUp } from "lucide-react";

export default async function GroupsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch user's groups from database
  const memberships = await prisma.groupMember.findMany({
    where: { clerkUserId: userId },
    include: {
      group: {
        include: {
          members: {
            select: {
              clerkUserId: true,
              displayNameSnapshot: true,
              imageUrl: true,
            },
          },
          _count: {
            select: { members: true, expenses: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const allGroups = memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    type: m.group.type,
    memberCount: m.group._count.members,
    expenseCount: m.group._count.expenses,
    role: m.role,
    members: m.group.members,
  }));

  // Separate friends (type=FRIEND) from groups (type=GROUP)
  const friends = allGroups.filter((g) => g.type === "FRIEND");
  const groups = allGroups.filter((g) => g.type === "GROUP");

  // Quick stats
  const totalExpenses = allGroups.reduce((sum, g) => sum + g.expenseCount, 0);
  const totalPeople = new Set(
    allGroups.flatMap((g) => g.members.map((m) => m.clerkUserId))
  ).size;

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-[oklch(0.80_0.065_220/0.08)] blur-3xl" />
      <div className="absolute top-60 -right-32 w-80 h-80 rounded-full bg-[oklch(0.82_0.175_85/0.06)] blur-3xl" />
      <div className="absolute bottom-20 left-1/4 w-72 h-72 rounded-full bg-[oklch(0.72_0.18_55/0.05)] blur-3xl" />

      <div className="relative mx-auto max-w-5xl py-6 sm:py-8 px-4 sm:px-6 space-y-6">
        {/* Stats Banner */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
            <Users className="h-5 w-5 text-primary mx-auto mb-1" />
            <div className="text-2xl font-bold text-primary">{totalPeople}</div>
            <div className="text-xs text-muted-foreground">People</div>
          </div>
          <div className="rounded-xl bg-[oklch(0.82_0.175_85/0.08)] border border-[oklch(0.82_0.175_85/0.25)] p-4 text-center">
            <Receipt className="h-5 w-5 text-[oklch(0.72_0.18_55)] mx-auto mb-1" />
            <div className="text-2xl font-bold text-[oklch(0.62_0.16_70)]">{totalExpenses}</div>
            <div className="text-xs text-muted-foreground">Expenses</div>
          </div>
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
            <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
            <div className="text-2xl font-bold text-primary">{friends.length + groups.length}</div>
            <div className="text-xs text-muted-foreground">Splits</div>
          </div>
        </div>

        {/* Friends Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[oklch(0.72_0.18_55)]" />
              <h2 className="text-xl font-bold">Friends</h2>
            </div>
            <AddFriendDialog />
          </div>
          {friends.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {friends.map((friend) => {
                const otherMember = friend.members.find(
                  (m) => m.clerkUserId !== userId
                );
                return (
                  <FriendCard
                    key={friend.id}
                    id={friend.id}
                    name={otherMember?.displayNameSnapshot || friend.name}
                    imageUrl={otherMember?.imageUrl}
                    isPending={friend.memberCount === 1}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[oklch(0.72_0.18_55/0.4)] bg-[oklch(0.82_0.175_85/0.05)] p-6 text-center">
              <UserPlus className="h-8 w-8 text-[oklch(0.72_0.18_55/0.5)] mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No friends added yet. Add a friend by their email to start splitting expenses 1:1.
              </p>
            </div>
          )}
        </section>

        <hr className="border-border" />

        {/* Groups Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Groups</h2>
            </div>
            <div className="flex gap-2">
              <JoinGroupDialog />
              <CreateGroupDialog />
            </div>
          </div>
          {groups.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  id={group.id}
                  name={group.name}
                  memberCount={group.memberCount}
                  role={group.role}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
              <Users className="h-8 w-8 text-primary/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No groups yet. Create a group for trips, shared housing, or any multi-person expenses.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
