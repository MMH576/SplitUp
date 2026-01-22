"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Pencil, Trash2, LogOut, UserMinus } from "lucide-react";

type Member = {
  id: string;
  clerkUserId: string;
  displayName: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: Date;
};

type GroupSettingsProps = {
  groupId: string;
  groupName: string;
  members: Member[];
  currentUserId: string;
  isAdmin: boolean;
};

export function GroupSettings({
  groupId,
  groupName,
  members,
  currentUserId,
  isAdmin,
}: GroupSettingsProps) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState(groupName);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const currentMember = members.find((m) => m.clerkUserId === currentUserId);
  const adminCount = members.filter((m) => m.role === "ADMIN").length;
  const isOnlyAdmin = currentMember?.role === "ADMIN" && adminCount === 1;

  const handleRename = async () => {
    if (!newName.trim()) {
      toast.error("Group name cannot be empty");
      return;
    }

    setIsRenaming(true);
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rename group");
      }

      toast.success("Group renamed!");
      setRenameOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to rename group"
      );
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteGroup = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete group");
      }

      toast.success("Group deleted");
      router.push("/groups");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete group"
      );
      setIsDeleting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, isLeave: boolean) => {
    if (isLeave) {
      setIsLeaving(true);
    } else {
      setRemovingMemberId(memberId);
    }

    try {
      const response = await fetch(
        `/api/groups/${groupId}/members/${memberId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove member");
      }

      if (isLeave) {
        toast.success("You left the group");
        router.push("/groups");
      } else {
        toast.success("Member removed");
        router.refresh();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove member"
      );
      if (isLeave) {
        setIsLeaving(false);
      } else {
        setRemovingMemberId(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Group Info Card */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Group Settings</CardTitle>
            <CardDescription>
              Manage your group name and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rename Group */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Group Name</p>
                <p className="text-sm text-muted-foreground">{groupName}</p>
              </div>
              <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rename group</DialogTitle>
                    <DialogDescription>
                      Enter a new name for your group.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="group-name">Group name</Label>
                    <Input
                      id="group-name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Enter group name"
                      className="mt-2"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setRenameOpen(false)}
                      disabled={isRenaming}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleRename} disabled={isRenaming}>
                      {isRenaming ? "Saving..." : "Save"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Delete Group */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="font-medium text-destructive">Delete Group</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this group and all its data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete group?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete &quot;{groupName}&quot; and all its
                      expenses, balances, and settlement history. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteGroup}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete Group"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members Card */}
      <Card>
        <CardHeader>
          <CardTitle>Group Members</CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? "member" : "members"} in
            this group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((member) => {
              const isCurrentUser = member.clerkUserId === currentUserId;
              const canRemove = isAdmin && !isCurrentUser;
              const isRemoving = removingMemberId === member.id;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <div className="font-medium">
                      {member.displayName}
                      {isCurrentUser && (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          (you)
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role === "ADMIN" && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        Admin
                      </span>
                    )}
                    {canRemove && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-muted-foreground hover:text-destructive"
                            disabled={isRemoving}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Remove {member.displayName} from this group? They
                              can rejoin if they have an invite link.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleRemoveMember(member.id, false)
                              }
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leave Group Card (for non-admins or admins who aren't the only admin) */}
      {!isOnlyAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leave Group</CardTitle>
            <CardDescription>
              Remove yourself from this group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={isLeaving}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {isLeaving ? "Leaving..." : "Leave Group"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave group?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to leave &quot;{groupName}&quot;? You&apos;ll
                    need a new invite link to rejoin.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      currentMember &&
                      handleRemoveMember(currentMember.id, true)
                    }
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Leave Group
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Warning for only admin */}
      {isOnlyAdmin && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base text-amber-800">
              You are the only admin
            </CardTitle>
            <CardDescription className="text-amber-700">
              You cannot leave this group until you make another member an admin
              or delete the group.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
