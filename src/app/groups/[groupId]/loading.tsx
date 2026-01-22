import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function GroupDetailLoading() {
  return (
    <div className="container py-6 sm:py-8 px-4 sm:px-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <Skeleton className="h-3 sm:h-4 w-32 sm:w-48 mb-2" />
          <Skeleton className="h-8 sm:h-9 w-32 sm:w-40 mb-2" />
          <Skeleton className="h-4 sm:h-5 w-28 sm:w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="grid grid-cols-4 sm:flex gap-2">
          <Skeleton className="h-10 w-full sm:w-24" />
          <Skeleton className="h-10 w-full sm:w-24" />
          <Skeleton className="h-10 w-full sm:w-24" />
          <Skeleton className="h-10 w-full sm:w-24" />
        </div>

        {/* Content skeleton - expenses list */}
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-5 w-16 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
