"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="container flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-red-600">Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {process.env.NODE_ENV === "development" && (
            <div className="p-3 bg-muted rounded-md text-sm font-mono overflow-auto max-h-40">
              {error.message}
            </div>
          )}
          <div className="flex gap-2 justify-center">
            <Button onClick={() => reset()} variant="default">
              Try again
            </Button>
            <Button onClick={() => window.location.href = "/groups"} variant="outline">
              Go to dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
