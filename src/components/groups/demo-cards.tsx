"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";

export function DemoFriendCard({ name }: { name: string }) {
  const firstLetter = name.charAt(0).toUpperCase();

  return (
    <Link href="/groups/demo?type=friend">
      <div className="relative">
        <Card className="h-full border-l-4 border-l-[oklch(0.72_0.18_55)] border-dashed hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[oklch(0.82_0.175_85/0.15)] flex items-center justify-center shrink-0">
                <span className="text-lg font-semibold text-[oklch(0.62_0.16_70)]">
                  {firstLetter}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{name}</CardTitle>
                <CardDescription>1:1 expenses</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        <span className="absolute top-2 right-2 text-[10px] font-medium bg-[oklch(0.82_0.175_85/0.15)] text-[oklch(0.52_0.14_60)] px-1.5 py-0.5 rounded">
          Example
        </span>
      </div>
    </Link>
  );
}

export function DemoGroupCard({ name, memberCount }: { name: string; memberCount: number }) {
  return (
    <Link href="/groups/demo?type=group">
      <div className="relative">
        <Card className="h-full border-l-4 border-l-primary border-dashed hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{name}</CardTitle>
                <CardDescription>
                  {memberCount} {memberCount === 1 ? "member" : "members"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        <span className="absolute top-2 right-2 text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">
          Example
        </span>
      </div>
    </Link>
  );
}
