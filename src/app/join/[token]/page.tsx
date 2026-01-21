"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type InviteInfo = {
  groupId: string;
  groupName: string;
  memberCount: number;
  expiresAt: string;
};

export default function JoinPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    async function validateInvite() {
      try {
        const response = await fetch(`/api/invites/${token}`);
        const result = await response.json();

        if (!response.ok) {
          setError(result.error || "Invalid invite link");
          return;
        }

        setInviteInfo(result.data);
      } catch {
        setError("Failed to validate invite link");
      } finally {
        setIsLoading(false);
      }
    }

    validateInvite();
  }, [token]);

  const handleJoin = async () => {
    setIsJoining(true);

    try {
      const response = await fetch(`/api/invites/${token}/accept`, {
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to join group");
      }

      if (result.data.alreadyMember) {
        toast.info("You're already a member of this group");
      } else {
        toast.success(`Joined ${result.data.groupName}!`);
      }

      router.push(`/groups/${result.data.groupId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join group");
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Validating invite...</CardTitle>
            <CardDescription>Please wait while we check the invite link.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push("/groups")}>
              Go to My Groups
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Join Group</CardTitle>
          <CardDescription>
            You've been invited to join a group
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-lg">{inviteInfo?.groupName}</h3>
            <p className="text-sm text-muted-foreground">
              {inviteInfo?.memberCount} {inviteInfo?.memberCount === 1 ? "member" : "members"}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => router.push("/groups")} disabled={isJoining}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={isJoining}>
            {isJoining ? "Joining..." : "Join Group"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
