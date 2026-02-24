"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function AuthError({ reset }: { reset: () => void }) {
  return (
    <main className="px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <p className="badge badge-warn">Auth Error</p>
          <h1 className="mt-3 text-2xl font-black">Authentication failed</h1>
          <p className="soft mt-2">Retry your action. If needed, return to login.</p>
          <div className="mt-4 flex gap-2">
            <Button onClick={reset}>Retry</Button>
            <a className="button button-muted" href="/login">Back to Auth</a>
          </div>
        </Card>
      </div>
    </main>
  );
}
