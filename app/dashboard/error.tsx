"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <main className="px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Card>
          <p className="badge badge-warn">Dashboard Error</p>
          <h1 className="mt-3 text-2xl font-black">Could not load dashboard</h1>
          <p className="soft mt-2">Retry now or return later.</p>
          <div className="mt-4 flex gap-2">
            <Button onClick={reset}>Retry</Button>
            <a className="button button-muted" href="/login">Go to Auth</a>
          </div>
        </Card>
      </div>
    </main>
  );
}
