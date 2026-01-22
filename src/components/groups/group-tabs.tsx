"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type GroupTabsProps = {
  defaultValue: string;
  groupId: string;
  children: React.ReactNode;
};

export function GroupTabs({ defaultValue, groupId, children }: GroupTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "expenses") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    const queryString = params.toString();
    router.push(`/groups/${groupId}${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  };

  return (
    <Tabs
      defaultValue={defaultValue}
      className="space-y-4"
      onValueChange={handleTabChange}
    >
      {children}
    </Tabs>
  );
}

export { TabsList, TabsTrigger };
export { TabsContent } from "@/components/ui/tabs";
