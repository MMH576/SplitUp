"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type GroupCardProps = {
  id: string;
  name: string;
  memberCount: number;
  role: string;
};

export function GroupCard({ id, name, memberCount, role }: GroupCardProps) {
  return (
    <Link href={`/groups/${id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{name}</CardTitle>
            {role === "ADMIN" && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Admin
              </span>
            )}
          </div>
          <CardDescription>
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
