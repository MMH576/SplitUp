"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Clock } from "lucide-react";

type FriendCardProps = {
  id: string;
  name: string;
  friendName?: string;
  isPending?: boolean;
};

export function FriendCard({ id, name, friendName, isPending }: FriendCardProps) {
  return (
    <Link href={`/groups/${id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{name}</CardTitle>
              {isPending ? (
                <CardDescription className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Waiting for them to join
                </CardDescription>
              ) : friendName ? (
                <CardDescription className="truncate">
                  with {friendName}
                </CardDescription>
              ) : (
                <CardDescription>1:1 expenses</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
