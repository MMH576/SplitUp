import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { GroupCard } from "@/components/groups/group-card";
import { JoinGroupDialog } from "@/components/groups/join-group-dialog";

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
          _count: {
            select: { members: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const groups = memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    memberCount: m.group._count.members,
    role: m.role,
  }));

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Groups</h1>
          <p className="text-muted-foreground">
            Manage your expense sharing groups
          </p>
        </div>
        <div className="flex gap-2">
          <JoinGroupDialog />
          <CreateGroupDialog />
        </div>
      </div>

      {groups.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <CardTitle>No groups yet</CardTitle>
            <CardDescription>
              Create a new group or join an existing one to start tracking expenses
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            <JoinGroupDialog />
            <CreateGroupDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      )}
    </div>
  );
}
