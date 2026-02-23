"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { publicApi } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMinorMoney } from "@/lib/currency";
import { Locale, t } from "@/lib/i18n";
import { getPreferredLocale } from "@/lib/locale";

function amount(minor: unknown, currencyCode: unknown, locale: Locale): string {
  return formatMinorMoney(
    Number(minor || 0),
    String(currencyCode || "SAR"),
    locale === "ar" ? "ar-SA" : "en-US",
  );
}

export default function ConfirmationPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ? decodeURIComponent(params.token) : "";
  const [locale] = useState<Locale>(() => getPreferredLocale("en"));
  const words = t(locale).storefront.confirmation;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setError(words.missingToken);
      setLoading(false);
      return;
    }

    void (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await publicApi.orderConfirmation(token);
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : words.failedLoad);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, words.failedLoad, words.missingToken]);

  return (
    <main className="px-4 py-8 sm:px-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="badge badge-info">{words.badge}</p>
              <h1 className="mt-3 text-2xl font-black sm:text-4xl">{words.title}</h1>
            </div>
            <Link href="/storefront" className="button button-muted">
              {words.backToStore}
            </Link>
          </div>
        </Card>

        {loading ? (
          <Card>
            <Skeleton className="h-6 w-48" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </Card>
        ) : null}

        {!loading && error ? (
          <Card>
            <EmptyState title={words.unavailable} description={error} />
          </Card>
        ) : null}

        {!loading && !error && data ? (
          <Card>
            <h2 className="text-xl font-bold">{String(data.order_number || "")}</h2>
            <p className="soft mt-2">
              {words.total}: {amount(data.total_amount_minor, data.currency_code, locale)}
            </p>
            <p className="soft mt-1">{words.status}: {String(data.status || "pending")}</p>
            {data.whatsapp_url ? (
              <a
                className="button button-primary mt-4 inline-flex"
                href={String(data.whatsapp_url)}
                target="_blank"
                rel="noreferrer"
              >
                Continue on WhatsApp
              </a>
            ) : null}
          </Card>
        ) : null}
      </div>
    </main>
  );
}
