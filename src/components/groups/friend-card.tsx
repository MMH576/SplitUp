"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock } from "lucide-react";

type FriendCardProps = {
  id: string;
  name: string;
  imageUrl?: string | null;
  isPending?: boolean;
};

export function FriendCard({ id, name, imageUrl, isPending }: FriendCardProps) {
  const firstLetter = name.charAt(0).toUpperCase();

  return (
    <Link href={`/groups/${id}`}>
      <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer h-full border-l-4 border-l-[oklch(0.72_0.18_55)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[oklch(0.82_0.175_85/0.15)] flex items-center justify-center overflow-hidden shrink-0">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-semibold text-[oklch(0.62_0.16_70)]">
                  {firstLetter}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{name}</CardTitle>
              {isPending ? (
                <CardDescription className="flex items-center gap-1 text-[oklch(0.72_0.18_55)]">
                  <Clock className="h-3 w-3" />
                  Waiting for them to join
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
