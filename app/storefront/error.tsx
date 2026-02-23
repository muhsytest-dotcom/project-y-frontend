"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function StorefrontError({ reset }: { reset: () => void }) {
  return (
    <main className="px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Card>
          <p className="badge badge-warn">Storefront Error</p>
          <h1 className="mt-3 text-2xl font-black">Storefront temporarily unavailable</h1>
          <p className="soft mt-2">Retry loading the storefront or return to home.</p>
          <div className="mt-4 flex gap-2">
            <Button onClick={reset}>Retry</Button>
            <Link className="button button-muted" href="/">Home</Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
