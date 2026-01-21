"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function JoinGroupDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const extractToken = (input: string): string | null => {
    // Handle full URL or just token
    const trimmed = input.trim();

    // Try to extract token from URL
    const urlMatch = trimmed.match(/\/join\/([a-f0-9]+)/i);
    if (urlMatch) {
      return urlMatch[1];
    }

    // Check if it's a raw token (64 hex characters)
    if (/^[a-f0-9]{64}$/i.test(trimmed)) {
      return trimmed;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = extractToken(inviteLink);
    if (!token) {
      toast.error("Please enter a valid invite link or token");
      return;
    }

    setIsLoading(true);

    try {
      // First validate the invite
      const validateResponse = await fetch(`/api/invites/${token}`);
      const validateResult = await validateResponse.json();

      if (!validateResponse.ok) {
        throw new Error(validateResult.error || "Invalid invite link");
      }

      // Accept the invite
      const acceptResponse = await fetch(`/api/invites/${token}/accept`, {
        method: "POST",
      });
      const acceptResult = await acceptResponse.json();

      if (!acceptResponse.ok) {
        throw new Error(acceptResult.error || "Failed to join group");
      }

      if (acceptResult.data.alreadyMember) {
        toast.info("You're already a member of this group");
      } else {
        toast.success(`Joined ${acceptResult.data.groupName}!`);
      }

      setOpen(false);
      setInviteLink("");
      router.refresh();
      router.push(`/groups/${acceptResult.data.groupId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join group");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Join Group</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Join a group</DialogTitle>
            <DialogDescription>
              Enter an invite link to join an existing group.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="invite-link">Invite link</Label>
              <Input
                id="invite-link"
                placeholder="Paste invite link here..."
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Joining..." : "Join Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
