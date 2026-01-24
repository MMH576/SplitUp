"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";

type GroupCardProps = {
  id: string;
  name: string;
  memberCount: number;
  role: string;
};

export function GroupCard({ id, name, memberCount, role }: GroupCardProps) {
  return (
    <Link href={`/groups/${id}`}>
      <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer h-full border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg truncate">{name}</CardTitle>
                {role === "ADMIN" && (
                  <span className="text-xs bg-[oklch(0.82_0.175_85/0.15)] text-[oklch(0.62_0.16_70)] px-2 py-0.5 rounded-full font-medium shrink-0 ml-2">
                    Admin
                  </span>
                )}
              </div>
              <CardDescription>
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
