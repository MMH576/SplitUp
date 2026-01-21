"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type InviteDialogProps = {
  groupId: string;
};

export function InviteDialog({ groupId }: InviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateInvite = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInDays: 7 }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create invite");
      }

      // Construct full invite URL
      const baseUrl = window.location.origin;
      const fullLink = `${baseUrl}/join/${result.data.token}`;
      setInviteLink(fullLink);
      toast.success("Invite link created!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create invite");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setInviteLink(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Invite Members</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite members</DialogTitle>
          <DialogDescription>
            Generate an invite link to share with friends. Links expire after 7 days.
          </DialogDescription>
        </DialogHeader>

        {!inviteLink ? (
          <div className="py-4">
            <Button onClick={generateInvite} disabled={isLoading} className="w-full">
              {isLoading ? "Generating..." : "Generate Invite Link"}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="invite-link">Invite link</Label>
              <div className="flex gap-2">
                <Input
                  id="invite-link"
                  value={inviteLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={copyToClipboard} variant="secondary">
                  Copy
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this link with people you want to invite. It will expire in 7 days.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
