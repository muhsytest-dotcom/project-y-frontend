import Link from "next/link";

const sellingPoints = [
  "No-login checkout with WhatsApp handoff",
  "Tenant-safe global SaaS architecture",
  "Manual payments now, Stripe-ready later",
  "Arabic/RTL-ready frontend foundation",
];

export default function HomePage() {
  return (
    <main className="px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="panel p-6 sm:p-8">
          <p className="badge badge-info">Universal Chat Commerce SaaS</p>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">
            Launch store owners in minutes. Convert buyers with fast chat-first checkout.
          </h1>
          <p className="soft mt-4 max-w-3xl text-base sm:text-lg">
            Built for Saudi first, then UAE, Europe, and USA. Multi-tenant, multi-product, no-login flow with email + WhatsApp order
            confirmation.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/auth" className="button button-primary">
              Signup / Login
            </Link>
            <Link href="/dashboard" className="button button-muted">
              Open Dashboard
            </Link>
            <Link href="/storefront" className="button button-muted">
              Open Storefront
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {sellingPoints.map((point) => (
            <article key={point} className="panel p-5">
              <h2 className="text-lg font-bold">{point}</h2>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
