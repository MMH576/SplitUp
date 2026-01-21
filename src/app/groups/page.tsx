import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function GroupsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // TODO: Fetch user's groups from database (Phase 4)
  const groups: { id: string; name: string; memberCount: number }[] = [];

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
          <Button variant="outline">Join Group</Button>
          <Button>Create Group</Button>
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
            <Button variant="outline">Join Group</Button>
            <Button>Create Group</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>{group.name}</CardTitle>
                <CardDescription>{group.memberCount} members</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
