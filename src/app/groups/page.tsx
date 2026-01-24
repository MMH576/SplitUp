import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { GroupCard } from "@/components/groups/group-card";
import { FriendCard } from "@/components/groups/friend-card";
import { JoinGroupDialog } from "@/components/groups/join-group-dialog";
import { AddFriendDialog } from "@/components/groups/add-friend-dialog";

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
            },
          },
          _count: {
            select: { members: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const allGroups = memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    memberCount: m.group._count.members,
    role: m.role,
    members: m.group.members,
  }));

  // Separate friends (2-person groups) from groups (3+ people)
  const friends = allGroups.filter((g) => g.memberCount <= 2);
  const groups = allGroups.filter((g) => g.memberCount > 2);

  return (
    <div className="container py-6 sm:py-8 px-4 sm:px-6 space-y-8">
      {/* Friends Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Friends</h2>
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
                  name={friend.name}
                  friendName={otherMember?.displayNameSnapshot}
                  isPending={friend.memberCount === 1}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No friends added yet. Add a friend by their email to start splitting expenses 1:1.
          </p>
        )}
      </section>

      {/* Groups Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Groups</h2>
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
          <p className="text-sm text-muted-foreground">
            No groups yet. Create a group for trips, shared housing, or any multi-person expenses.
          </p>
        )}
      </section>
    </div>
  );
}
