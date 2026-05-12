"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="flex items-center justify-center w-12 h-12 bg-destructive/10 rounded-full">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <div className="text-center">
        <h2 className="font-semibold text-lg">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {error.message ?? "An unexpected error occurred."}
        </p>
      </div>
      <Button onClick={reset} variant="outline">Try again</Button>
    </div>
  );
}
