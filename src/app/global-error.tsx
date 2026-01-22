"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              Critical Error
            </h1>
            <p className="text-gray-600 mb-4">
              A critical error occurred. Please refresh the page or try again later.
            </p>
            {process.env.NODE_ENV === "development" && (
              <pre className="p-3 bg-gray-100 rounded-md text-sm font-mono overflow-auto max-h-40 mb-4 text-left">
                {error.message}
              </pre>
            )}
            <div className="flex gap-2 justify-center">
              <Button onClick={() => reset()}>
                Try again
              </Button>
              <Button onClick={() => window.location.href = "/"} variant="outline">
                Go home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
