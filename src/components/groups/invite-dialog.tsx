"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Trash2, Plus, Link2 } from "lucide-react";

type Invite = {
  id: string;
  token: string;
  expiresAt: string;
  createdAt: string;
};

type InviteDialogProps = {
  groupId: string;
};

export function InviteDialog({ groupId }: InviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Fetch active invites when dialog opens
  useEffect(() => {
    if (open) {
      fetchInvites();
    }
  }, [open]);

  const fetchInvites = async () => {
    setIsLoadingInvites(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/invites`);
      if (response.ok) {
        const result = await response.json();
        setInvites(result.data || []);
      }
    } catch {
      // Silently fail - invites list is optional
    } finally {
      setIsLoadingInvites(false);
    }
  };

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

      toast.success("Invite link created!");
      // Add new invite to the list
      setInvites((prev) => [
        {
          id: result.data.id || Date.now().toString(),
          token: result.data.token,
          expiresAt: result.data.expiresAt,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create invite"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    setRevokingId(inviteId);
    try {
      const response = await fetch(
        `/api/groups/${groupId}/invites/${inviteId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to revoke invite");
      }

      toast.success("Invite revoked");
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to revoke invite"
      );
    } finally {
      setRevokingId(null);
    }
  };

  const copyLink = async (token: string) => {
    const baseUrl = window.location.origin;
    const fullLink = `${baseUrl}/join/${token}`;

    try {
      await navigator.clipboard.writeText(fullLink);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setInvites([]);
    }
  };

  const formatExpiry = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Expired";
    if (diffDays === 1) return "Expires tomorrow";
    return `Expires in ${diffDays} days`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Invite Members</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite members</DialogTitle>
          <DialogDescription>
            Create invite links to share with friends. Links expire after 7
            days.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Generate New Invite Button */}
          <Button
            onClick={generateInvite}
            disabled={isLoading}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? "Creating..." : "Create New Invite Link"}
          </Button>

          {/* Active Invites List */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Active Invites</Label>
            {isLoadingInvites ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Loading invites...
              </div>
            ) : invites.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                No active invites. Create one above.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 border rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-mono truncate">
                          ...{invite.token.slice(-12)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatExpiry(invite.expiresAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(invite.token)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copy link</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeInvite(invite.id)}
                        disabled={revokingId === invite.id}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Revoke invite</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
