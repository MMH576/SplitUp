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
import { UserPlus } from "lucide-react";

export function AddFriendDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add friend");
      }

      toast.success(`Added ${result.data.friendName}!`);
      setOpen(false);
      setEmail("");
      router.refresh();
      router.push(`/groups/${result.data.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add friend"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-[oklch(0.72_0.18_55/0.4)] text-[oklch(0.62_0.16_70)] hover:bg-[oklch(0.82_0.175_85/0.1)]">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Friend
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Split with a friend</DialogTitle>
            <DialogDescription>
              Enter your friend&apos;s email to start tracking expenses 1:1. They must already have an account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="friend-email">Friend&apos;s email</Label>
              <Input
                id="friend-email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {isLoading ? "Searching..." : "Add Friend"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
