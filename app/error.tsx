"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // keep console logging for debugging in production incidents
    console.error(error);
  }, [error]);

  return (
    <main className="px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Card>
          <p className="badge badge-warn">Unexpected Error</p>
          <h1 className="mt-3 text-2xl font-black">Something went wrong</h1>
          <p className="soft mt-2">Please retry this action. If the problem persists, refresh and try again.</p>
          <Button className="mt-4" onClick={reset}>Try Again</Button>
        </Card>
      </div>
    </main>
  );
}
