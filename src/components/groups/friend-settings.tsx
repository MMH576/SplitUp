"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { UserX } from "lucide-react";

type FriendSettingsProps = {
  groupId: string;
  friendName: string;
};

export function FriendSettings({ groupId, friendName }: FriendSettingsProps) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveFriend = async () => {
    setIsRemoving(true);
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove friend");
      }

      toast.success("Friend removed");
      router.push("/groups");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove friend"
      );
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-destructive">Remove Friend</CardTitle>
          <CardDescription>
            Remove {friendName} and delete all shared expenses and settlement history. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isRemoving}>
                <UserX className="h-4 w-4 mr-2" />
                {isRemoving ? "Removing..." : "Remove Friend"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove friend?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove {friendName} and delete all shared
                  expenses, balances, and settlement history between you two. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRemoveFriend}
                  disabled={isRemoving}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isRemoving ? "Removing..." : "Remove Friend"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
